import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  Label,
  Panel,
  SectionHeading,
  Select,
  TextInput,
} from "@/components/kit";
import { ModelDetail } from "@/components/ModelDetail";
import { ModelTable } from "@/components/ModelTable";
import { getModels, getProviders, valueScore } from "@/services/modelService";
import { useDataVersion } from "@/services/dataSource";
import type { Model } from "@/types/model";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Model Explorer — ModelPulse" },
      {
        name: "description",
        content:
          "Search, filter and sort every tracked AI model by price, quality, speed, value and context window.",
      },
      { property: "og:title", content: "Model Explorer — ModelPulse" },
      {
        property: "og:description",
        content: "Discover AI models by price, quality, context window and value score.",
      },
    ],
  }),
  component: Explorer,
});

type SortKey = "cheapest" | "quality" | "value" | "fastest" | "context";

const PAGE_SIZE = 15;

const PRICE_BANDS = [
  { id: "all", label: "Any input price", max: null },
  { id: "0.1", label: "Under $0.10 / 1M", max: 0.1 },
  { id: "1", label: "Under $1.00 / 1M", max: 1 },
  { id: "5", label: "Under $5.00 / 1M", max: 5 },
] as const;

const CONTEXT_BANDS = [
  { id: "all", label: "Any context", min: null },
  { id: "128k", label: "128K+", min: 128_000 },
  { id: "256k", label: "256K+", min: 256_000 },
  { id: "1m", label: "1M+", min: 1_000_000 },
] as const;

function Explorer() {
  const dataVersion = useDataVersion();
  const allModels = useMemo(() => getModels(), [dataVersion]);
  const providers = useMemo(() => getProviders(), [dataVersion]);

  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [priceBand, setPriceBand] = useState<string>("all");
  const [minQuality, setMinQuality] = useState("all");
  const [contextBand, setContextBand] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("value");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Model | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxPrice = PRICE_BANDS.find((b) => b.id === priceBand)?.max ?? null;
    const minContext = CONTEXT_BANDS.find((b) => b.id === contextBand)?.min ?? null;
    const qualityFloor = minQuality === "all" ? null : Number(minQuality);

    const result = allModels.filter((m) => {
      if (q && !`${m.name} ${m.provider}`.toLowerCase().includes(q)) return false;
      if (provider !== "all" && m.provider !== provider) return false;
      if (maxPrice != null) {
        const price = m.inputPrice.value ?? m.inputPrice.upperBound;
        if (price == null || price > maxPrice) return false;
      }
      if (qualityFloor != null && (m.quality.value ?? -1) < qualityFloor) return false;
      if (minContext != null && (m.context.value ?? -1) < minContext) return false;
      return true;
    });

    const rank = (m: Model): number => {
      switch (sort) {
        case "cheapest":
          return m.inputPrice.value ?? m.inputPrice.upperBound ?? Number.POSITIVE_INFINITY;
        case "quality":
          return -(m.quality.value ?? Number.NEGATIVE_INFINITY);
        case "value":
          return -(valueScore(m) ?? Number.NEGATIVE_INFINITY);
        case "fastest":
          return -(m.speed.value ?? Number.NEGATIVE_INFINITY);
        case "context":
          return -(m.context.value ?? Number.NEGATIVE_INFINITY);
      }
    };

    return result.sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (Number.isFinite(ra) && Number.isFinite(rb) && ra !== rb) return ra - rb;
      if (!Number.isFinite(ra) && Number.isFinite(rb)) return 1;
      if (Number.isFinite(ra) && !Number.isFinite(rb)) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [allModels, query, provider, priceBand, minQuality, contextBand, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const reset = () => {
    setQuery("");
    setProvider("all");
    setPriceBand("all");
    setMinQuality("all");
    setContextBand("all");
    setSort("value");
    setPage(0);
  };

  return (
    <div className="page-enter pt-10">
      <SectionHeading
        eyebrow="Explorer"
        title="Every tracked model, filterable"
        description="All figures come straight from the scraped dataset. Fields the source does not publish show N/A — nothing is filled in for them."
        action={
          <Button variant="ghost" onClick={reset}>
            <SlidersHorizontal className="size-4" aria-hidden /> Reset filters
          </Button>
        }
      />

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <TextInput
                id="search"
                className="pl-9"
                placeholder="Model or provider…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All providers</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Input price</Label>
            <Select
              id="price"
              value={priceBand}
              onChange={(e) => {
                setPriceBand(e.target.value);
                setPage(0);
              }}
            >
              {PRICE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="quality">Minimum quality</Label>
            <Select
              id="quality"
              value={minQuality}
              onChange={(e) => {
                setMinQuality(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">Any (incl. unpublished)</option>
              <option value="10">10+</option>
              <option value="20">20+</option>
              <option value="30">30+</option>
              <option value="40">40+</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="context">Context window</Label>
            <Select
              id="context"
              value={contextBand}
              onChange={(e) => {
                setContextBand(e.target.value);
                setPage(0);
              }}
            >
              {CONTEXT_BANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sort">Sort by</Label>
            <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="value">Best value</option>
              <option value="cheapest">Cheapest</option>
              <option value="quality">Highest quality</option>
              <option value="fastest">Fastest</option>
              <option value="context">Largest context</option>
            </Select>
          </div>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length} of {allModels.length} models match your filters.
      </p>

      <Panel className="mt-3 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No models match these filters"
            hint="Try widening the price band or clearing the minimum quality requirement — many models in the dataset have no published quality index."
          />
        ) : (
          <ModelTable models={rows} onSelect={setSelected} showMaxOutput />
        )}
      </Panel>

      {rows.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Next <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <ModelDetail model={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
