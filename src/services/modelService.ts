import rawData from "@/data/models.json";
import type {
  CostEstimate,
  Metric,
  Model,
  RawModel,
  RawScrapePage,
  Statistics,
} from "@/types/model";

/**
 * Centralised data access layer.
 *
 * Today it reads the JSON snapshot that was collected with Bright Data
 * Scraper Studio. To move to a live collector/API, replace `loadRaw()` with a
 * fetch call that returns the same `RawScrapePage[]` shape — no UI changes.
 */

const MISSING = new Set(["", "--", "-", "n/a", "na", "null", "undefined", "—"]);

function isMissing(raw: string | null | undefined): boolean {
  return raw == null || MISSING.has(String(raw).trim().toLowerCase());
}

function emptyMetric(): Metric {
  return { display: null, value: null, approximate: false, upperBound: null };
}

function parseNumberLike(raw: string): { value: number | null; upperBound: number | null; approximate: boolean } {
  const text = raw.trim();
  const approximate = /^[<>~≈]/.test(text);
  const multiplierMatch = text.match(/([KMB])\s*$/i);
  const numeric = text.replace(/[^0-9.]/g, "");
  if (numeric === "" || Number.isNaN(Number(numeric))) {
    return { value: null, upperBound: null, approximate };
  }
  let n = Number(numeric);
  if (multiplierMatch) {
    const m = String(multiplierMatch[1]).toUpperCase();
    n *= m === "K" ? 1_000 : m === "M" ? 1_000_000 : 1_000_000_000;
  }
  if (approximate) {
    // "<$0.01" -> exact number unknown, but bounded above.
    return { value: null, upperBound: n, approximate: true };
  }
  return { value: n, upperBound: n, approximate: false };
}

function toMetric(raw: string | null | undefined): Metric {
  if (isMissing(raw)) return emptyMetric();
  const display = String(raw).trim();
  const parsed = parseNumberLike(display);
  return { display, ...parsed };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * ModelPulse Value Score (derived, unofficial).
 * Only computed when quality and a usable blended price exist.
 * score = quality / blended price per 1M tokens (70% input / 30% output).
 */
function deriveValue(quality: Metric, input: Metric, output: Metric): number | null {
  if (quality.value == null) return null;
  const inPrice = input.value ?? input.upperBound;
  const outPrice = output.value ?? output.upperBound;
  if (inPrice == null && outPrice == null) return null;
  const blended = 0.7 * (inPrice ?? outPrice ?? 0) + 0.3 * (outPrice ?? inPrice ?? 0);
  if (!blended || blended <= 0) return null;
  return Math.round((quality.value / blended) * 10) / 10;
}

function normalize(raw: RawModel): Model | null {
  const name = isMissing(raw.model_name) ? null : String(raw.model_name).trim();
  if (!name) return null;
  const provider = isMissing(raw.provider) ? "Unknown" : String(raw.provider).trim();
  const inputPrice = toMetric(raw.input_price_per_1m_tokens);
  const outputPrice = toMetric(raw.output_price_per_1m_tokens);
  const quality = toMetric(raw.quality);
  const value = toMetric(raw.value);
  return {
    id: `${slugify(provider)}--${slugify(name)}`,
    name,
    provider,
    inputPrice,
    outputPrice,
    context: toMetric(raw.context_window),
    maxOutput: toMetric(raw.max_output),
    speed: toMetric(raw.speed),
    quality,
    value,
    derivedValue: value.value == null ? deriveValue(quality, inputPrice, outputPrice) : null,
  };
}

function loadRaw(): RawScrapePage[] {
  return rawData as RawScrapePage[];
}

let cache: Model[] | null = null;

export function getModels(): Model[] {
  if (cache) return cache;
  const seen = new Set<string>();
  const models: Model[] = [];
  for (const page of loadRaw()) {
    for (const raw of page.models ?? []) {
      const model = normalize(raw);
      if (!model || seen.has(model.id)) continue;
      seen.add(model.id);
      models.push(model);
    }
  }
  cache = models;
  return models;
}

export function getModelById(id: string): Model | undefined {
  return getModels().find((m) => m.id === id);
}

export function getProviders(): string[] {
  return Array.from(new Set(getModels().map((m) => m.provider))).sort((a, b) => a.localeCompare(b));
}

export function getSourceUrl(): string | null {
  const page = loadRaw()[0];
  return page?.input?.url ?? null;
}

/** Effective value score: dataset field first, derived score as fallback. */
export function valueScore(model: Model): number | null {
  return model.value.value ?? model.derivedValue;
}

function minBy(models: Model[], pick: (m: Model) => number | null): Model | null {
  let best: Model | null = null;
  let bestVal = Number.POSITIVE_INFINITY;
  for (const m of models) {
    const v = pick(m);
    if (v == null) continue;
    if (v < bestVal) {
      bestVal = v;
      best = m;
    }
  }
  return best;
}

function maxBy(models: Model[], pick: (m: Model) => number | null): Model | null {
  let best: Model | null = null;
  let bestVal = Number.NEGATIVE_INFINITY;
  for (const m of models) {
    const v = pick(m);
    if (v == null) continue;
    if (v > bestVal) {
      bestVal = v;
      best = m;
    }
  }
  return best;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? null;
  const lo = sorted[mid - 1];
  const hi = sorted[mid];
  if (lo == null || hi == null) return null;
  return (lo + hi) / 2;
}

export function getStatistics(): Statistics {
  const models = getModels();
  const inputs = models.map((m) => m.inputPrice.value).filter((v): v is number => v != null);
  const outputs = models.map((m) => m.outputPrice.value).filter((v): v is number => v != null);
  return {
    totalModels: models.length,
    providerCount: getProviders().length,
    pricedModels: inputs.length,
    averageInputPrice: average(inputs),
    averageOutputPrice: average(outputs),
    medianInputPrice: median(inputs),
    highestQuality: maxBy(models, (m) => m.quality.value),
    cheapestModel: minBy(models, (m) => m.inputPrice.value ?? m.inputPrice.upperBound),
    bestValue: maxBy(models, (m) => valueScore(m)),
    fastest: maxBy(models, (m) => m.speed.value),
    largestContext: maxBy(models, (m) => m.context.value),
    sourceUrl: getSourceUrl(),
  };
}

export interface WorkloadInput {
  inputTokens: number;
  outputTokens: number;
}

/**
 * input cost  = inputTokens / 1_000_000 * input price
 * output cost = outputTokens / 1_000_000 * output price
 * Unavailable prices are never treated as zero.
 */
export function estimateCost(model: Model, workload: WorkloadInput): CostEstimate {
  const inPrice = model.inputPrice.value ?? model.inputPrice.upperBound;
  const outPrice = model.outputPrice.value ?? model.outputPrice.upperBound;
  const missing: string[] = [];
  if (inPrice == null) missing.push("input price");
  if (outPrice == null) missing.push("output price");
  if (inPrice == null || outPrice == null) {
    return {
      inputCost: null,
      outputCost: null,
      total: null,
      approximate: false,
      unavailableReason: `No ${missing.join(" or ")} published for this model.`,
    };
  }
  const inputCost = (workload.inputTokens / 1_000_000) * inPrice;
  const outputCost = (workload.outputTokens / 1_000_000) * outPrice;
  return {
    inputCost,
    outputCost,
    total: inputCost + outputCost,
    approximate: model.inputPrice.approximate || model.outputPrice.approximate,
    unavailableReason: null,
  };
}

export interface RecommendationRequest {
  workloadType: string;
  inputTokens: number;
  outputTokens: number;
  maxBudget: number | null;
  minQuality: number | null;
  minContext: number | null;
  preferSpeed: boolean;
}

export interface RankedModel {
  model: Model;
  estimate: CostEstimate;
  score: number;
  reasons: string[];
}

export interface RecommendationResult {
  ranked: RankedModel[];
  best: RankedModel | null;
  alternatives: RankedModel[];
  cheaperByPercent: number | null;
  excludedCount: number;
}

export function recommendModels(req: RecommendationRequest): RecommendationResult {
  const all = getModels();
  const candidates: RankedModel[] = [];

  for (const model of all) {
    const estimate = estimateCost(model, {
      inputTokens: req.inputTokens,
      outputTokens: req.outputTokens,
    });
    if (estimate.total == null) continue;
    if (req.maxBudget != null && estimate.total > req.maxBudget) continue;
    if (req.minQuality != null && (model.quality.value ?? -1) < req.minQuality) continue;
    if (req.minContext != null && (model.context.value ?? -1) < req.minContext) continue;
    if (req.preferSpeed && model.speed.value == null) continue;

    const reasons: string[] = [];
    // Score: value-per-dollar oriented, only from available fields.
    const vs = valueScore(model);
    let score = 0;
    if (vs != null) {
      score += Math.log10(1 + vs) * 40;
      reasons.push(`ModelPulse Value Score of ${vs}`);
    }
    if (model.quality.value != null) {
      score += model.quality.value * 1.5;
      reasons.push(`quality index ${model.quality.value}`);
    }
    if (estimate.total > 0) score += Math.max(0, 30 - Math.log10(1 + estimate.total) * 12);
    if (req.preferSpeed && model.speed.value != null) {
      score += model.speed.value / 10;
      reasons.push(`${model.speed.display} throughput`);
    }
    if (model.context.value != null) reasons.push(`${model.context.display} context window`);
    if (estimate.approximate) reasons.push("published price is below $0.01 per 1M tokens");
    candidates.push({ model, estimate, score, reasons });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] ?? null;
  const cheaperAlternatives = candidates
    .slice(1)
    .filter((c) => best?.estimate.total != null && (c.estimate.total ?? 0) < best.estimate.total!)
    .sort((a, b) => (a.estimate.total ?? 0) - (b.estimate.total ?? 0))
    .slice(0, 3);

  const nextSuitable = candidates[1];
  let cheaperByPercent: number | null = null;
  if (best?.estimate.total != null && nextSuitable?.estimate.total != null && nextSuitable.estimate.total > 0) {
    cheaperByPercent =
      ((nextSuitable.estimate.total - best.estimate.total) / nextSuitable.estimate.total) * 100;
  }

  return {
    ranked: candidates.slice(0, 8),
    best,
    alternatives: cheaperAlternatives,
    cheaperByPercent,
    excludedCount: all.length - candidates.length,
  };
}
