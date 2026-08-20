import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  DataValue,
  EmptyState,
  Label,
  Panel,
  SectionHeading,
  Tag,
  TextInput,
} from "@/components/kit";
import { ValueScoreInfo } from "@/components/ValueScoreInfo";
import { estimateCost, getModels, valueScore } from "@/services/modelService";
import { useDataVersion } from "@/services/dataSource";
import { formatUsd, parseTokenInput } from "@/lib/format";
import type { Model } from "@/types/model";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare AI Models — ModelPulse" },
      {
        name: "description",
        content:
          "Put up to four AI models side by side on price, context, quality, speed, value and estimated monthly workload cost.",
      },
      { property: "og:title", content: "Compare AI Models — ModelPulse" },
      {
        property: "og:description",
        content: "Side-by-side AI model comparison with dynamic best-price and best-value winners.",
      },
    ],
  }),
  component: Compare,
});

const MAX = 4;

type WinnerKey = "price" | "quality" | "speed" | "value" | "context";

function Compare() {
  const dataVersion = useDataVersion();
  const models = useMemo(() => getModels(), [dataVersion]);
  const [ids, setIds] = useState<string[]>(() => models.slice(0, 3).map((m) => m.id));
  const [query, setQuery] = useState("");
  const [inputTokens, setInputTokens] = useState("10000000");
  const [outputTokens, setOutputTokens] = useState("2000000");

  const selected = useMemo(
    () => ids.map((id) => models.find((m) => m.id === id)).filter((m): m is Model => !!m),
    [ids, models],
  );

  const workload = {
    inputTokens: parseTokenInput(inputTokens),
    outputTokens: parseTokenInput(outputTokens),
  };

  const estimates = useMemo(
    () => selected.map((m) => estimateCost(m, workload)),
    [selected, workload.inputTokens, workload.outputTokens],
  );

  const winners = useMemo(() => {
    const winner: Partial<Record<WinnerKey, string>> = {};
    const best = (
      key: WinnerKey,
      pick: (m: Model, i: number) => number | null,
      mode: "min" | "max",
    ) => {
      let bestId: string | undefined;
      let bestVal: number | null = null;
      selected.forEach((m, i) => {
        const v = pick(m, i);
        if (v == null) return;
        if (bestVal == null || (mode === "min" ? v < bestVal : v > bestVal)) {
          bestVal = v;
          bestId = m.id;
        }
      });
      if (bestId && selected.length > 1) winner[key] = bestId;
    };
    best("price", (_m, i) => estimates[i]?.total ?? null, "min");
    best("quality", (m) => m.quality.value, "max");
    best("speed", (m) => m.speed.value, "max");
    best("value", (m) => valueScore(m), "max");
    best("context", (m) => m.context.value, "max");
    return winner;
  }, [selected, estimates]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return models
      .filter((m) => `${m.name} ${m.provider}`.toLowerCase().includes(q) && !ids.includes(m.id))
      .slice(0, 6);
  }, [models, query, ids]);

  const add = (model: Model) => {
    if (ids.length >= MAX) return;
    setIds([...ids, model.id]);
    setQuery("");
  };

  return (
    <div className="pt-10">
      <SectionHeading
        eyebrow="Compare"
        title="Side-by-side model comparison"
        description="Add up to four models. Winner labels are calculated from the selected models only, and appear only where the dataset publishes the figure."
        action={<ValueScoreInfo />}
      />

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <Label htmlFor="model-search">Add a model ({ids.length}/{MAX})</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <TextInput
                id="model-search"
                className="pl-9"
                placeholder={ids.length >= MAX ? "Remove one to add another" : "Search models…"}
                disabled={ids.length >= MAX}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                {results.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => add(m)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.provider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="cmp-in">Monthly input tokens</Label>
            <TextInput
              id="cmp-in"
              inputMode="numeric"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cmp-out">Monthly output tokens</Label>
            <TextInput
              id="cmp-out"
              inputMode="numeric"
              value={outputTokens}
              onChange={(e) => setOutputTokens(e.target.value)}
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setIds(ids.filter((id) => id !== m.id))}
                className="inline-flex items-center gap-2 rounded-full border border-violet/35 bg-violet/12 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-violet/60"
              >
                {m.name}
                <X className="size-3" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-6 overflow-hidden">
        {selected.length === 0 ? (
          <EmptyState
            title="No models selected"
            hint="Search above to add models to the comparison."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-44 px-4 py-4 text-left text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Metric
                  </th>
                  {selected.map((m) => (
                    <th key={m.id} className="px-4 py-4 text-left">
                      <span className="block font-semibold text-foreground">{m.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {m.provider}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="Provider">
                  {selected.map((m) => (
                    <Cell key={m.id}>{m.provider}</Cell>
                  ))}
                </Row>
                <Row label="Input price / 1M">
                  {selected.map((m) => (
                    <Cell key={m.id}>
                      <DataValue metric={m.inputPrice} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Output price / 1M">
                  {selected.map((m) => (
                    <Cell key={m.id}>
                      <DataValue metric={m.outputPrice} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Context window">
                  {selected.map((m) => (
                    <Cell key={m.id} win={winners.context === m.id ? "Largest context" : null}>
                      <DataValue metric={m.context} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Max output">
                  {selected.map((m) => (
                    <Cell key={m.id}>
                      <DataValue metric={m.maxOutput} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Speed">
                  {selected.map((m) => (
                    <Cell key={m.id} win={winners.speed === m.id ? "Best speed" : null}>
                      <DataValue metric={m.speed} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Quality index">
                  {selected.map((m) => (
                    <Cell key={m.id} win={winners.quality === m.id ? "Best quality" : null}>
                      <DataValue metric={m.quality} />
                    </Cell>
                  ))}
                </Row>
                <Row label="Value score">
                  {selected.map((m) => {
                    const score = valueScore(m);
                    return (
                      <Cell key={m.id} win={winners.value === m.id ? "Best value" : null}>
                        {score == null ? (
                          <span className="num text-muted-foreground/60">N/A</span>
                        ) : (
                          <span className="num text-violet-soft">{score}</span>
                        )}
                      </Cell>
                    );
                  })}
                </Row>
                <Row label="Estimated monthly cost">
                  {selected.map((m, i) => {
                    const est = estimates[i];
                    return (
                      <Cell key={m.id} win={winners.price === m.id ? "Best price" : null}>
                        {est?.total == null ? (
                          <span
                            className="num text-muted-foreground/60"
                            title={est?.unavailableReason ?? "Unavailable"}
                          >
                            N/A
                          </span>
                        ) : (
                          <span className="num text-foreground">
                            {formatUsd(est.total)}
                            {est.approximate && (
                              <span className="ml-1 text-[10px] text-muted-foreground">approx</span>
                            )}
                          </span>
                        )}
                      </Cell>
                    );
                  })}
                </Row>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-muted-foreground">
        Cost estimates use your token volumes above: input tokens ÷ 1M × input price, plus output
        tokens ÷ 1M × output price. Models without a published price show N/A rather than $0.00.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/50">
      <th
        scope="row"
        className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children, win }: { children: React.ReactNode; win?: string | null }) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground">{children}</span>
        {win && <Tag tone="violet">{win}</Tag>}
      </div>
    </td>
  );
}
