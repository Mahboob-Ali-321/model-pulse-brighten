import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Panel, SectionHeading } from "@/components/kit";
import { ValueScoreInfo } from "@/components/ValueScoreInfo";
import { getModels, getStatistics, valueScore } from "@/services/modelService";
import { useDataVersion } from "@/services/dataSource";
import { formatCompact } from "@/lib/format";
import type { Model } from "@/types/model";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "AI Model Analytics — ModelPulse" },
      {
        name: "description",
        content:
          "Price distributions, provider coverage, quality-vs-price and context-window analytics computed from the tracked AI model dataset.",
      },
      { property: "og:title", content: "AI Model Analytics — ModelPulse" },
      {
        property: "og:description",
        content: "Distribution and tradeoff analytics across tracked AI models.",
      },
    ],
  }),
  component: Analytics,
});

const VIOLET = "var(--color-violet)";
const BLUE = "var(--color-chart-2)";
const TEAL = "var(--color-chart-3)";
const AMBER = "var(--color-chart-4)";

interface Bucket {
  label: string;
  count: number;
}

function bucketize(values: number[], edges: number[], format: (n: number) => string): Bucket[] {
  const buckets: Bucket[] = [];
  for (let i = 0; i < edges.length; i += 1) {
    const lo = i === 0 ? 0 : edges[i - 1]!;
    const hi = edges[i]!;
    buckets.push({
      label: i === 0 ? `< ${format(hi)}` : `${format(lo)}–${format(hi)}`,
      count: values.filter((v) => v > lo && v <= hi).length,
    });
  }
  const last = edges[edges.length - 1]!;
  buckets.push({ label: `> ${format(last)}`, count: values.filter((v) => v > last).length });
  return buckets.filter((b) => b.count > 0);
}

function Analytics() {
  const dataVersion = useDataVersion();
  const models = useMemo(() => getModels(), [dataVersion]);
  const stats = useMemo(() => getStatistics(), [dataVersion]);

  const priceOf = (m: Model, kind: "in" | "out") => {
    const metric = kind === "in" ? m.inputPrice : m.outputPrice;
    return metric.value ?? metric.upperBound;
  };

  const inputBuckets = useMemo(
    () =>
      bucketize(
        models.map((m) => priceOf(m, "in")).filter((v): v is number => v != null),
        [0.1, 0.5, 1, 3, 10],
        (n) => `$${n}`,
      ),
    [models],
  );

  const outputBuckets = useMemo(
    () =>
      bucketize(
        models.map((m) => priceOf(m, "out")).filter((v): v is number => v != null),
        [0.5, 2, 5, 15, 40],
        (n) => `$${n}`,
      ),
    [models],
  );

  const providerBuckets = useMemo(() => {
    const counts = new Map<string, number>();
    models.forEach((m) => counts.set(m.provider, (counts.get(m.provider) ?? 0) + 1));
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [models]);

  const contextBuckets = useMemo(() => {
    const counts = new Map<string, number>();
    models.forEach((m) => {
      if (!m.context.display) return;
      counts.set(m.context.display, (counts.get(m.context.display) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count, sort: 0 }))
      .sort((a, b) => b.count - a.count);
  }, [models]);

  const valueBuckets = useMemo(
    () =>
      bucketize(
        models.map((m) => valueScore(m)).filter((v): v is number => v != null),
        [25, 75, 150, 300, 600],
        (n) => String(n),
      ),
    [models],
  );

  const qualityVsPrice = useMemo(
    () =>
      models
        .filter((m) => m.quality.value != null && priceOf(m, "in") != null)
        .map((m) => ({ x: priceOf(m, "in")!, y: m.quality.value!, name: m.name })),
    [models],
  );

  const speedVsPrice = useMemo(
    () =>
      models
        .filter((m) => m.speed.value != null && priceOf(m, "in") != null)
        .map((m) => ({ x: priceOf(m, "in")!, y: m.speed.value!, name: m.name })),
    [models],
  );

  const insights = [
    {
      label: "Most affordable",
      model: stats.cheapestModel,
      detail: stats.cheapestModel?.inputPrice.display ?? "N/A",
    },
    {
      label: "Highest quality",
      model: stats.highestQuality,
      detail: stats.highestQuality ? `Quality ${stats.highestQuality.quality.display}` : "N/A",
    },
    {
      label: "Best value",
      model: stats.bestValue,
      detail: stats.bestValue ? `Score ${valueScore(stats.bestValue)}` : "N/A",
    },
    { label: "Fastest", model: stats.fastest, detail: stats.fastest?.speed.display ?? "N/A" },
    {
      label: "Largest context",
      model: stats.largestContext,
      detail: stats.largestContext?.context.display ?? "N/A",
    },
  ];

  return (
    <div className="page-enter pt-10">
      <SectionHeading
        eyebrow="Analytics"
        title="How the market is priced"
        description="Every chart is computed from the scraped dataset. Models without a published figure are excluded from that chart rather than counted as zero."
        action={<ValueScoreInfo />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {insights.map((i) => (
          <Panel key={i.label} className="lift h-full p-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-violet-soft uppercase">
              {i.label}
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-foreground" title={i.model?.name}>
              {i.model?.name ?? "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">{i.model?.provider ?? "No data"}</p>
            <p className="num mt-2 text-xs text-foreground">{i.detail}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Input price distribution"
          note={`${inputBuckets.reduce((a, b) => a + b.count, 0)} models with a usable input price`}
        >
          <BarsChart data={inputBuckets} color={VIOLET} />
        </ChartCard>
        <ChartCard
          title="Output price distribution"
          note={`${outputBuckets.reduce((a, b) => a + b.count, 0)} models with a usable output price`}
        >
          <BarsChart data={outputBuckets} color={BLUE} />
        </ChartCard>
        <ChartCard title="Models per provider" note={`${providerBuckets.length} providers tracked`}>
          <BarsChart data={providerBuckets} color={TEAL} angled />
        </ChartCard>
        <ChartCard
          title="Context window distribution"
          note="Grouped by the context value published for each model"
        >
          <BarsChart data={contextBuckets} color={AMBER} angled />
        </ChartCard>
        <ChartCard
          title="Quality vs input price"
          note={`${qualityVsPrice.length} models publish both a quality index and a price`}
        >
          <ScatterPlot data={qualityVsPrice} yLabel="Quality" color={VIOLET} />
        </ChartCard>
        <ChartCard
          title="Speed vs input price"
          note={`${speedVsPrice.length} models publish throughput`}
        >
          <ScatterPlot data={speedVsPrice} yLabel="tok/s" color={BLUE} />
        </ChartCard>
        <ChartCard
          title="Value score distribution"
          note="Dataset value figures, plus derived ModelPulse scores where the dataset is silent"
        >
          <BarsChart data={valueBuckets} color={TEAL} />
        </ChartCard>
        <Panel className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Data coverage</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Not every model in the source publishes every field. Coverage across{" "}
            {stats.totalModels} models:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <Coverage label="Exact input price" count={stats.pricedModels} total={stats.totalModels} />
            <Coverage
              label="Quality index"
              count={models.filter((m) => m.quality.value != null).length}
              total={stats.totalModels}
            />
            <Coverage
              label="Throughput"
              count={models.filter((m) => m.speed.value != null).length}
              total={stats.totalModels}
            />
            <Coverage
              label="Value score (published or derived)"
              count={models.filter((m) => valueScore(m) != null).length}
              total={stats.totalModels}
            />
            <Coverage
              label="Context window"
              count={models.filter((m) => m.context.value != null).length}
              total={stats.totalModels}
            />
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Largest context in the dataset: {formatCompact(stats.largestContext?.context.value)}{" "}
            tokens.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Coverage({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <li>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num text-foreground">
          {count}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--gradient-violet)" }}
        />
      </div>
    </li>
  );
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="lift h-full p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">{note}</p>
      <div className="h-64 w-full">{children}</div>
    </Panel>
  );
}

const axisStyle = { fill: "var(--color-muted-foreground)", fontSize: 11 };

const tooltipStyle = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-foreground)",
};

function BarsChart({
  data,
  color,
  angled = false,
}: {
  data: Bucket[];
  color: string;
  angled?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: angled ? 44 : 4, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={axisStyle}
          interval={0}
          angle={angled ? -35 : 0}
          textAnchor={angled ? "end" : "middle"}
          height={angled ? 50 : 24}
          stroke="var(--color-border)"
        />
        <YAxis tick={axisStyle} stroke="var(--color-border)" allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface)" }} />
        <Bar dataKey="count" name="Models" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ScatterPlot({
  data,
  yLabel,
  color,
}: {
  data: { x: number; y: number; name: string }[];
  yLabel: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 12, bottom: 20, left: -16 }}>
        <CartesianGrid stroke="var(--color-border)" />
        <XAxis
          type="number"
          dataKey="x"
          name="Input $/1M"
          tick={axisStyle}
          stroke="var(--color-border)"
          tickFormatter={(v: number) => `$${v}`}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={axisStyle}
          stroke="var(--color-border)"
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={() => ""}
        />
        <Scatter data={data} fill={color} name="Models" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
