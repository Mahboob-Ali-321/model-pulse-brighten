import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  DataValue,
  EmptyState,
  Label,
  Panel,
  SectionHeading,
  Select,
  Tag,
  TextInput,
} from "@/components/kit";
import { ValueScoreInfo } from "@/components/ValueScoreInfo";
import {
  estimateCost,
  getModels,
  recommendModels,
  valueScore,
  type RecommendationResult,
} from "@/services/modelService";
import { formatUsd, parseTokenInput } from "@/lib/format";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Workload Cost Calculator — ModelPulse" },
      {
        name: "description",
        content:
          "Estimate monthly AI model costs from your token volumes, then let ModelPulse rank the models that fit your budget and quality floor.",
      },
      { property: "og:title", content: "Workload Cost Calculator — ModelPulse" },
      {
        property: "og:description",
        content: "Estimate monthly token costs and find the best-fit AI model for your workload.",
      },
    ],
  }),
  component: CalculatorPage,
});

const WORKLOADS = [
  "Chat assistant",
  "RAG / document Q&A",
  "Code generation",
  "Summarisation",
  "Agents / tool use",
  "Batch classification",
];

const QUALITY_OPTIONS = [
  { value: "", label: "No minimum" },
  { value: "10", label: "10+" },
  { value: "20", label: "20+" },
  { value: "30", label: "30+" },
  { value: "40", label: "40+" },
];

const CONTEXT_OPTIONS = [
  { value: "", label: "No minimum" },
  { value: "128000", label: "128K+" },
  { value: "256000", label: "256K+" },
  { value: "1000000", label: "1M+" },
];

function CalculatorPage() {
  const models = useMemo(() => getModels(), []);
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [inputTokens, setInputTokens] = useState("10000000");
  const [outputTokens, setOutputTokens] = useState("2000000");
  const [requests, setRequests] = useState("50000");
  const [budget, setBudget] = useState("100");
  const [minQuality, setMinQuality] = useState("");
  const [minContext, setMinContext] = useState("");
  const [workloadType, setWorkloadType] = useState(WORKLOADS[0] as string);
  const [preferSpeed, setPreferSpeed] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  const workload = {
    inputTokens: parseTokenInput(inputTokens),
    outputTokens: parseTokenInput(outputTokens),
  };
  const requestCount = parseTokenInput(requests);
  const budgetValue = budget.trim() === "" ? null : parseTokenInput(budget);

  const model = models.find((m) => m.id === modelId) ?? null;
  const estimate = model ? estimateCost(model, workload) : null;
  const qualityFloor = minQuality === "" ? null : Number(minQuality);
  const meetsQuality =
    qualityFloor == null || (model?.quality.value != null && model.quality.value >= qualityFloor);
  const overBudget = budgetValue != null && estimate?.total != null && estimate.total > budgetValue;

  const runRecommendation = () => {
    setRecommendation(
      recommendModels({
        workloadType,
        inputTokens: workload.inputTokens,
        outputTokens: workload.outputTokens,
        maxBudget: budgetValue,
        minQuality: qualityFloor,
        minContext: minContext === "" ? null : Number(minContext),
        preferSpeed,
      }),
    );
  };

  return (
    <div className="pt-10">
      <SectionHeading
        eyebrow="Calculator"
        title="What will this workload actually cost?"
        description="Enter your monthly token volumes. Costs are computed from published prices only — a model with no published price is reported as unavailable, never as free."
        action={<ValueScoreInfo />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Panel className="h-fit p-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="workload">Workload type</Label>
              <Select
                id="workload"
                value={workloadType}
                onChange={(e) => setWorkloadType(e.target.value)}
              >
                {WORKLOADS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Select id="model" value={modelId} onChange={(e) => setModelId(e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.provider}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="in">Monthly input tokens</Label>
                <TextInput
                  id="in"
                  inputMode="numeric"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="out">Monthly output tokens</Label>
                <TextInput
                  id="out"
                  inputMode="numeric"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="req">Requests / month</Label>
                <TextInput
                  id="req"
                  inputMode="numeric"
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="budget">Monthly budget ($)</Label>
                <TextInput
                  id="budget"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minq">Minimum quality</Label>
                <Select id="minq" value={minQuality} onChange={(e) => setMinQuality(e.target.value)}>
                  {QUALITY_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="minc">Minimum context</Label>
                <Select id="minc" value={minContext} onChange={(e) => setMinContext(e.target.value)}>
                  {CONTEXT_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={preferSpeed}
                onChange={(e) => setPreferSpeed(e.target.checked)}
                className="size-4 accent-[var(--violet)]"
              />
              Prefer models with published throughput
            </label>
            <Button className="w-full" onClick={runRecommendation}>
              <Wand2 className="size-4" aria-hidden /> Find my best model
            </Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            {!model ? (
              <EmptyState title="Select a model to estimate cost" />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-soft uppercase">
                      {model.provider}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">{model.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {estimate?.approximate && <Tag tone="warn">Approximate pricing</Tag>}
                    {!meetsQuality && <Tag tone="warn">Below quality floor</Tag>}
                    {overBudget && <Tag tone="warn">Over budget</Tag>}
                    {!overBudget && estimate?.total != null && budgetValue != null && (
                      <Tag tone="success">Within budget</Tag>
                    )}
                  </div>
                </div>

                {estimate?.total == null ? (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-chart-4/40 bg-chart-4/10 p-4 text-sm text-foreground">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-chart-4" aria-hidden />
                    <p>
                      Cost estimate unavailable — {estimate?.unavailableReason} We do not treat an
                      unpublished price as $0.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Metric label="Input cost" value={formatUsd(estimate.inputCost)} />
                    <Metric label="Output cost" value={formatUsd(estimate.outputCost)} />
                    <Metric label="Total / month" value={formatUsd(estimate.total)} highlight />
                  </div>
                )}

                {estimate?.total != null && estimate.approximate && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    The dataset publishes “{model.inputPrice.display}” rather than an exact price, so
                    this total is an upper-bound estimate.
                  </p>
                )}

                {estimate?.total != null && requestCount > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Across {requestCount.toLocaleString()} requests that is{" "}
                    <span className="num text-foreground">
                      {formatUsd(estimate.total / requestCount, 4)}
                    </span>{" "}
                    per request.
                  </p>
                )}

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Small label="Input / 1M">
                    <DataValue metric={model.inputPrice} />
                  </Small>
                  <Small label="Output / 1M">
                    <DataValue metric={model.outputPrice} />
                  </Small>
                  <Small label="Context">
                    <DataValue metric={model.context} />
                  </Small>
                  <Small label="Quality">
                    <DataValue metric={model.quality} />
                  </Small>
                </dl>
              </>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-violet-soft" aria-hidden />
              <h3 className="text-lg font-semibold text-foreground">Find my best model</h3>
            </div>
            {!recommendation ? (
              <p className="text-sm text-muted-foreground">
                Set your constraints on the left and run the recommendation. ModelPulse ranks only
                models whose published data satisfies every constraint you set.
              </p>
            ) : recommendation.best == null ? (
              <EmptyState
                title="No model satisfies these constraints"
                hint={`${recommendation.excludedCount} models were excluded — try raising the budget, lowering the quality floor, or removing the context requirement.`}
              />
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-violet/35 bg-violet/10 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {recommendation.best.model.name} is the best fit for your {workloadType.toLowerCase()}{" "}
                    workload.
                  </p>
                  <p className="num mt-2 text-2xl font-semibold text-violet-soft">
                    {formatUsd(recommendation.best.estimate.total)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      estimated monthly cost
                    </span>
                  </p>
                  {recommendation.cheaperByPercent != null &&
                    recommendation.cheaperByPercent > 0.5 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {recommendation.cheaperByPercent.toFixed(0)}% cheaper than the next suitable
                        model in this ranking.
                      </p>
                    )}
                  <ul className="mt-3 space-y-1.5">
                    {recommendation.best.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-chart-3" aria-hidden /> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {recommendation.alternatives.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Cheaper alternatives that still meet your constraints
                    </p>
                    <div className="space-y-2">
                      {recommendation.alternatives.map((alt) => {
                        const bestQuality = recommendation.best?.model.quality.value ?? null;
                        const altQuality = alt.model.quality.value;
                        const tradeoff =
                          bestQuality != null && altQuality != null
                            ? altQuality < bestQuality
                              ? `${bestQuality - altQuality} lower quality index`
                              : `equal or higher quality index`
                            : "quality index not published for both models";
                        return (
                          <div
                            key={alt.model.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface/60 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {alt.model.name}{" "}
                                <span className="text-xs text-muted-foreground">
                                  {alt.model.provider}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Tradeoff: {tradeoff}
                              </p>
                            </div>
                            <span className="num text-sm text-foreground">
                              {formatUsd(alt.estimate.total)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Full shortlist
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <tbody>
                        {recommendation.ranked.map((r) => (
                          <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                            <td className="py-2 pr-3 text-foreground">{r.model.name}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">
                              {r.model.provider}
                            </td>
                            <td className="num py-2 pr-3 text-right text-muted-foreground">
                              {valueScore(r.model) ?? "N/A"}
                            </td>
                            <td className="num py-2 text-right text-foreground">
                              {formatUsd(r.estimate.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Ranking uses only fields present in the dataset (price, quality index, published
                  throughput, context window, value). Nothing is inferred where the source is silent.{" "}
                  <Link to="/explorer" className="text-violet-soft underline-offset-2 hover:underline">
                    Browse all models
                  </Link>
                  .
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`num mt-2 text-xl font-semibold ${highlight ? "text-violet-soft" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Small({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/50 p-3">
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
