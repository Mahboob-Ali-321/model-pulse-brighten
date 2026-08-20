import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Calculator, Compass, Gauge, Sparkles, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Panel, SectionHeading, Tag } from "@/components/kit";
import { DataPipeline } from "@/components/DataPipeline";
import { ModelDetail } from "@/components/ModelDetail";
import { ModelTable, type BadgeKind } from "@/components/ModelTable";
import { ValueScoreInfo } from "@/components/ValueScoreInfo";
import { getModels, getStatistics, valueScore } from "@/services/modelService";
import { useDataVersion } from "@/services/dataSource";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { formatCompact, formatPrice1M } from "@/lib/format";
import type { Model } from "@/types/model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ModelPulse — Find the right AI model for your workload" },
      {
        name: "description",
        content:
          "Live-tracked AI model pricing, context, quality and value scores in one dashboard. Pick the model that fits your workload and budget.",
      },
      { property: "og:title", content: "ModelPulse — AI Model Intelligence" },
      {
        property: "og:description",
        content:
          "Compare pricing, context, quality and performance across AI models to choose the right one.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const dataVersion = useDataVersion();
  const stats = useMemo(() => getStatistics(), [dataVersion]);
  const models = useMemo(() => getModels(), [dataVersion]);
  const [selected, setSelected] = useState<Model | null>(null);

  const bestValue = useMemo(() => {
    return [...models]
      .filter((m) => valueScore(m) != null)
      .sort((a, b) => (valueScore(b) ?? 0) - (valueScore(a) ?? 0))
      .slice(0, 8);
  }, [models]);

  const badges = useMemo(() => {
    const map: Record<string, BadgeKind[]> = {};
    const push = (model: Model | null, kind: BadgeKind) => {
      if (!model) return;
      map[model.id] = [...(map[model.id] ?? []), kind];
    };
    push(stats.bestValue, "value");
    push(stats.cheapestModel, "cheapest");
    push(stats.fastest, "fastest");
    push(stats.highestQuality, "quality");
    push(stats.largestContext, "context");
    return map;
  }, [stats]);

  return (
    <div className="pt-10">
      <RefreshDataButton />
      <section
        className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-12"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <Tag tone="violet" className="mb-6">
          <Sparkles className="size-3" aria-hidden /> {stats.totalModels} models ·{" "}
          {stats.providerCount} providers
        </Tag>
        <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
          <span className="text-gradient">
            Find the right AI model for your workload — not just the cheapest one.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Compare pricing, context, quality and performance across AI models to choose the model that
          fits your workload and budget.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/explorer">
            <Button>
              <Compass className="size-4" aria-hidden /> Explore all models
            </Button>
          </Link>
          <Link to="/calculator">
            <Button variant="outline">
              <Calculator className="size-4" aria-hidden /> Estimate monthly cost
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<Boxes className="size-4" aria-hidden />}
          label="Models tracked"
          value={String(stats.totalModels)}
          hint={`${stats.providerCount} providers in the dataset`}
        />
        <Kpi
          icon={<TrendingDown className="size-4" aria-hidden />}
          label="Average input price"
          value={formatPrice1M(stats.averageInputPrice)}
          hint={`per 1M tokens · ${stats.pricedModels} models with exact prices`}
        />
        <Kpi
          icon={<Gauge className="size-4" aria-hidden />}
          label="Highest quality"
          value={stats.highestQuality?.name ?? "N/A"}
          hint={
            stats.highestQuality
              ? `Quality index ${stats.highestQuality.quality.display} · ${stats.highestQuality.provider}`
              : "No quality data published"
          }
        />
        <Kpi
          icon={<Sparkles className="size-4" aria-hidden />}
          label="Cheapest model"
          value={stats.cheapestModel?.name ?? "N/A"}
          hint={
            stats.cheapestModel
              ? `${stats.cheapestModel.inputPrice.display ?? "N/A"} input · ${stats.cheapestModel.provider}`
              : "No pricing data published"
          }
        />
      </section>

      <section className="mt-12">
        <SectionHeading
          eyebrow="Ranked by value score"
          title="Best value models"
          description="Highest quality-per-dollar in the dataset. Badges appear only when the underlying figure exists in the source data."
          action={<ValueScoreInfo />}
        />
        <Panel className="overflow-hidden">
          <ModelTable models={bestValue} badges={badges} onSelect={setSelected} />
        </Panel>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-3">
        <Highlight
          title="Largest context"
          model={stats.largestContext}
          detail={
            stats.largestContext
              ? `${stats.largestContext.context.display} context (${formatCompact(stats.largestContext.context.value)} tokens)`
              : "N/A"
          }
        />
        <Highlight
          title="Fastest throughput"
          model={stats.fastest}
          detail={stats.fastest ? `${stats.fastest.speed.display}` : "N/A"}
        />
        <Highlight
          title="Best ModelPulse value"
          model={stats.bestValue}
          detail={stats.bestValue ? `Value score ${valueScore(stats.bestValue)}` : "N/A"}
        />
      </section>

      <section className="mt-12">
        <DataPipeline />
      </section>

      <ModelDetail model={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Panel className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-7 place-items-center rounded-lg bg-violet/14 text-violet-soft">
          {icon}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.16em] uppercase">{label}</span>
      </div>
      <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-foreground" title={value}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </Panel>
  );
}

function Highlight({
  title,
  model,
  detail,
}: {
  title: string;
  model: Model | null;
  detail: string;
}) {
  return (
    <Panel className="p-5">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-violet-soft uppercase">
        {title}
      </p>
      <p className="mt-3 text-lg font-semibold text-foreground">{model?.name ?? "N/A"}</p>
      <p className="text-xs text-muted-foreground">{model?.provider ?? "No data available"}</p>
      <p className="num mt-3 text-sm text-foreground">{detail}</p>
    </Panel>
  );
}
