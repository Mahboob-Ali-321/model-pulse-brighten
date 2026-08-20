import { supabase } from "@/integrations/supabase/client";
import type { RawModel } from "@/types/model";

/** Key used in the `app_metadata` table for the refresh timestamp. */
export const LAST_REFRESHED_KEY = "last_refreshed_at";

export interface RemoteDataset {
  models: RawModel[];
  lastRefreshedAt: string | null;
}

function toRawModel(row: Record<string, unknown>): RawModel {
  const text = (key: string): string | null => {
    const value = row[key];
    return value == null ? null : String(value);
  };
  return {
    model_name: text("model_name"),
    provider: text("provider"),
    input_price_per_1m_tokens: text("input_price_per_1m_tokens"),
    output_price_per_1m_tokens: text("output_price_per_1m_tokens"),
    context_window: text("context_window"),
    max_output: text("max_output"),
    speed: text("speed"),
    quality: text("quality"),
    value: text("value"),
  };
}

/**
 * Reads the live dataset from Supabase. Returns an empty model list when the
 * table has never been populated so callers can keep the bundled snapshot.
 */
export async function fetchRemoteDataset(): Promise<RemoteDataset> {
  const [modelsResult, metaResult] = await Promise.all([
    supabase
      .from("models")
      .select(
        "model_name, provider, input_price_per_1m_tokens, output_price_per_1m_tokens, context_window, max_output, speed, quality, value",
      )
      .order("model_name", { ascending: true })
      .limit(1000),
    supabase
      .from("app_metadata")
      .select("value, updated_at")
      .eq("key", LAST_REFRESHED_KEY)
      .maybeSingle(),
  ]);

  if (modelsResult.error) throw modelsResult.error;

  const rows = (modelsResult.data ?? []) as Record<string, unknown>[];
  const meta = metaResult.error ? null : metaResult.data;

  return {
    models: rows.map(toRawModel).filter((m) => m.model_name),
    lastRefreshedAt: (meta?.value as string | null) ?? null,
  };
}

export interface RefreshResult {
  success: boolean;
  modelCount: number;
  lastRefreshedAt: string | null;
  error: string | null;
}

/** Triggers the `refresh-model-data` edge function (Bright Data scrape). */
export async function triggerRefresh(): Promise<RefreshResult> {
  const { data, error } = await supabase.functions.invoke<RefreshResult>("refresh-model-data", {
    body: {},
  });

  if (error) {
    return {
      success: false,
      modelCount: 0,
      lastRefreshedAt: null,
      error: error.message || "The refresh request failed.",
    };
  }
  if (!data) {
    return {
      success: false,
      modelCount: 0,
      lastRefreshedAt: null,
      error: "The refresh returned no response.",
    };
  }
  return data;
}
