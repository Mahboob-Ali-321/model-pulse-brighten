// Refreshes the ModelPulse dataset: triggers a Bright Data collector run,
// polls until the scrape output is ready, then upserts it into Postgres.
// (Edge Functions are not used on this stack — this is the equivalent
// server-side endpoint, and the Bright Data token never leaves the server.)
import { createFileRoute } from "@tanstack/react-router";

const COLLECTOR_ID = "c_mszj9x081ywv6c91q0";
const TARGET_URL = "https://tokencost.app/pricing";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_MS = 180_000;

const FIELDS = [
  "model_name",
  "provider",
  "input_price_per_1m_tokens",
  "output_price_per_1m_tokens",
  "context_window",
  "max_output",
  "speed",
  "quality",
  "value",
] as const;

type RawModelRow = Record<(typeof FIELDS)[number], string | null>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function fail(message: string, status = 500) {
  console.error("[refresh-model-data]", message);
  return json({ success: false, modelCount: 0, lastRefreshedAt: null, error: message }, status);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function asText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

/** Bright Data output can be a flat list of models or pages containing models. */
function extractModels(payload: unknown): RawModelRow[] {
  const out: RawModelRow[] = [];
  const seen = new Set<string>();

  const pushRow = (row: Record<string, unknown>) => {
    const name = asText(row["model_name"] ?? row["model"] ?? row["name"]);
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    const model = {} as RawModelRow;
    for (const field of FIELDS) model[field] = asText(row[field]);
    model.model_name = name;
    out.push(model);
  };

  const walk = (node: unknown, depth = 0) => {
    if (depth > 6 || node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const row = node as Record<string, unknown>;
    if (Array.isArray(row["models"])) {
      walk(row["models"], depth + 1);
      return;
    }
    if (row["model_name"] ?? row["model"] ?? row["name"]) {
      pushRow(row);
      return;
    }
    for (const value of Object.values(row)) {
      if (value != null && typeof value === "object") walk(value, depth + 1);
    }
  };

  walk(payload);
  return out;
}

function parseDatasetBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    // NDJSON fallback.
    return body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as unknown;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
}

export const Route = createFileRoute("/api/refresh-model-data")({
  server: {
    handlers: {
      POST: async () => {
        const token = process.env["BRIGHTDATA_API_TOKEN"];
        if (!token) return fail("BRIGHTDATA_API_TOKEN is not configured.", 500);

        try {
          // 1. Trigger a new collector run.
          const triggerResponse = await fetch(
            `https://api.brightdata.com/dca/trigger?collector=${COLLECTOR_ID}&queue_next=1`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([{ url: TARGET_URL }]),
            },
          );

          const triggerText = await triggerResponse.text();
          if (!triggerResponse.ok) {
            return fail(
              `Bright Data trigger failed (${triggerResponse.status}): ${triggerText.slice(0, 300)}`,
              502,
            );
          }

          let collectionId: string | null = null;
          try {
            const parsed = JSON.parse(triggerText) as Record<string, unknown>;
            collectionId =
              asText(parsed["collection_id"]) ??
              asText(parsed["response_id"]) ??
              asText(parsed["id"]) ??
              asText(parsed["job_id"]);
          } catch {
            collectionId = asText(triggerText);
          }
          if (!collectionId) return fail("Bright Data did not return a collection id.", 502);

          // 2. Poll for the dataset until it is ready (max 3 minutes).
          const deadline = Date.now() + MAX_POLL_MS;
          let models: RawModelRow[] = [];
          let lastStatus = "pending";

          while (Date.now() < deadline) {
            await sleep(POLL_INTERVAL_MS);
            const datasetResponse = await fetch(
              `https://api.brightdata.com/dca/dataset?id=${encodeURIComponent(collectionId)}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const body = await datasetResponse.text();

            if (datasetResponse.status === 202 || datasetResponse.status === 404) {
              lastStatus = `not ready (${datasetResponse.status})`;
              continue;
            }
            if (!datasetResponse.ok) {
              lastStatus = `error ${datasetResponse.status}: ${body.slice(0, 200)}`;
              continue;
            }

            const found = extractModels(parseDatasetBody(body));
            if (found.length > 0) {
              models = found;
              break;
            }
            lastStatus = "collector returned no rows yet";
          }

          if (models.length === 0) {
            return fail(`Timed out waiting for Bright Data results (${lastStatus}).`, 504);
          }

          // 3. Upsert into Postgres (service role, server-side only).
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rows = models.map((model) => ({
            ...model,
            source_url: TARGET_URL,
            updated_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabaseAdmin
            .from("models")
            .upsert(rows, { onConflict: "model_name" });
          if (upsertError) return fail(`Failed to save models: ${upsertError.message}`, 500);

          const lastRefreshedAt = new Date().toISOString();
          const { error: metaError } = await supabaseAdmin
            .from("app_metadata")
            .upsert({ key: "last_refreshed_at", value: lastRefreshedAt }, { onConflict: "key" });
          if (metaError) console.error("[refresh-model-data] metadata upsert failed:", metaError.message);

          return json({ success: true, modelCount: rows.length, lastRefreshedAt, error: null });
        } catch (error) {
          return fail(
            error instanceof Error ? error.message : "Unexpected error during refresh.",
            500,
          );
        }
      },
    },
  },
});
