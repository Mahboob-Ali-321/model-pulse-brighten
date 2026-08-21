import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Calculator, Compass, Gauge, Sparkles, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Panel, SectionHeading, Tag } from "@/components/kit";
import { DataPipeline } from "@/components/DataPipeline";
import { CountUpNumber, Reveal } from "@/components/motion";
import { Marquee } from "@/components/Marquee";
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
    <div className="page-enter pt-10">
      <RefreshDataButton />
      <section className="relative isolate overflow-hidden rounded-3xl border border-border p-6 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="mp-grid pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden />
        <div
          className="mp-aurora pointer-events-none absolute -top-1/3 -left-1/4 -z-10 size-[70%] rounded-full bg-violet/25 blur-3xl"
          aria-hidden
        />
        <div
          className="mp-float pointer-events-none absolute -right-16 -bottom-24 -z-10 size-64 rounded-full bg-chart-2/20 blur-3xl"
          aria-hidden
        />

        <div className="mp-enter" style={{ "--mp-delay": "40ms" } as React.CSSProperties}>
          <Tag tone="violet" className="mb-6 max-w-full whitespace-normal">
            <Sparkles className="size-3" aria-hidden /> {stats.totalModels} models ·{" "}
            {stats.providerCount} providers
          </Tag>
        </div>
        <h1
          className="mp-enter max-w-3xl text-[1.75rem] leading-[1.12] font-bold tracking-tight sm:text-4xl lg:text-5xl"
          style={{ "--mp-delay": "140ms" } as React.CSSProperties}
        >
          <span className="text-gradient">
            Find the right AI model for your workload — not just the cheapest one.
          </span>
        </h1>
        <p
          className="mp-enter mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base"
          style={{ "--mp-delay": "240ms" } as React.CSSProperties}
        >
          Compare pricing, context, quality and performance across AI models to choose the model that
          fits your workload and budget.
        </p>
        <div
          className="mp-enter mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          style={{ "--mp-delay": "340ms" } as React.CSSProperties}
        >
          <Link to="/explorer" className="w-full sm:w-auto">
            <Button className="w-full transition-transform duration-300 hover:scale-[1.02] sm:w-auto">
              <Compass className="size-4" aria-hidden /> Explore all models
            </Button>
          </Link>
          <Link to="/calculator" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full transition-transform duration-300 hover:scale-[1.02] sm:w-auto"
            >
              <Calculator className="size-4" aria-hidden /> Estimate monthly cost
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0}>
          <Kpi
            icon={<Boxes className="size-4" aria-hidden />}
            label="Models tracked"
            value={String(stats.totalModels)}
            countTo={stats.totalModels}
            hint={`${stats.providerCount} providers in the dataset`}
          />
        </Reveal>
        <Reveal delay={90}>
          <Kpi
            icon={<TrendingDown className="size-4" aria-hidden />}
            label="Average input price"
            value={formatPrice1M(stats.averageInputPrice)}
            hint={`per 1M tokens · ${stats.pricedModels} models with exact prices`}
          />
        </Reveal>
        <Reveal delay={180}>
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
        </Reveal>
        <Reveal delay={270}>
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
        </Reveal>
      </section>

      <Reveal as="section" className="mt-12" motion="zoom">
        <SectionHeading
          eyebrow="Ranked by value score"
          title="Best value models"
          description="Highest quality-per-dollar in the dataset. Badges appear only when the underlying figure exists in the source data."
          action={<ValueScoreInfo />}
        />
        <Panel className="overflow-hidden">
          <ModelTable models={bestValue} badges={badges} onSelect={setSelected} animateRows />
        </Panel>
      </Reveal>

      <Reveal as="section" className="mt-12">
        <SectionHeading
          eyebrow="Always in motion"
          title="Model spotlight"
          description="A continuously scrolling slice of the live dataset. Hover to slow it down, click a card for full details."
        />
        <Marquee speed={64} gap="1rem" className="py-1">
          {carousel.map((model) => (
            <ModelCard key={model.id} model={model} onSelect={setSelected} />
          ))}
        </Marquee>
      </Reveal>


      <section className="mt-12 grid gap-4 lg:grid-cols-3">
        <Reveal delay={0}>
          <Highlight
            title="Largest context"
            model={stats.largestContext}
            detail={
              stats.largestContext
                ? `${stats.largestContext.context.display} context (${formatCompact(stats.largestContext.context.value)} tokens)`
                : "N/A"
            }
          />
        </Reveal>
        <Reveal delay={110}>
          <Highlight
            title="Fastest throughput"
            model={stats.fastest}
            detail={stats.fastest ? `${stats.fastest.speed.display}` : "N/A"}
          />
        </Reveal>
        <Reveal delay={220}>
          <Highlight
            title="Best ModelPulse value"
            model={stats.bestValue}
            detail={stats.bestValue ? `Value score ${valueScore(stats.bestValue)}` : "N/A"}
          />
        </Reveal>
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
  countTo,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  countTo?: number;
}) {
  return (
    <Panel className="lift h-full p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-7 place-items-center rounded-lg bg-violet/14 text-violet-soft">
          {icon}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.16em] uppercase">{label}</span>
      </div>
      <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-foreground" title={value}>
        {countTo != null ? <CountUpNumber value={countTo} /> : value}
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
    <Panel className="lift h-full p-5">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-violet-soft uppercase">
        {title}
      </p>
      <p className="mt-3 text-lg font-semibold text-foreground">{model?.name ?? "N/A"}</p>
      <p className="text-xs text-muted-foreground">{model?.provider ?? "No data available"}</p>
      <p className="num mt-3 text-sm text-foreground">{detail}</p>
    </Panel>
  );
}
