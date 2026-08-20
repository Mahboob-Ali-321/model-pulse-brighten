/** Raw shape of the scraped TokenCost dataset (source of truth). */
export interface RawModel {
  model_name: string | null;
  provider: string | null;
  input_price_per_1m_tokens: string | null;
  output_price_per_1m_tokens: string | null;
  context_window: string | null;
  max_output: string | null;
  speed: string | null;
  quality: string | null;
  value: string | null;
}

export interface RawScrapePage {
  models?: RawModel[] | null;
  input?: { url?: string | null } | null;
}

/**
 * A parsed metric. `value` is null when the dataset does not provide a
 * reliable number — never coerced to 0. `approximate` is true for special
 * displays such as "<$0.01" where the exact number is unknown.
 */
export interface Metric {
  /** Exact string from the dataset, or null when absent. */
  display: string | null;
  /** Reliable numeric value, or null when unavailable/approximate-only. */
  value: number | null;
  approximate: boolean;
  /** Best-effort upper bound (used for "<$0.01" style displays). */
  upperBound: number | null;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice: Metric;
  outputPrice: Metric;
  context: Metric;
  maxOutput: Metric;
  speed: Metric;
  quality: Metric;
  /** Dataset "value" field — the ModelPulse Value Score when present. */
  value: Metric;
  /** Derived score when the dataset value field is missing (null if not computable). */
  derivedValue: number | null;
}

export interface Statistics {
  totalModels: number;
  providerCount: number;
  pricedModels: number;
  averageInputPrice: number | null;
  averageOutputPrice: number | null;
  medianInputPrice: number | null;
  highestQuality: Model | null;
  cheapestModel: Model | null;
  bestValue: Model | null;
  fastest: Model | null;
  largestContext: Model | null;
  sourceUrl: string | null;
}

export interface CostEstimate {
  inputCost: number | null;
  outputCost: number | null;
  total: number | null;
  /** True when prices were approximate ("<$0.01") — estimate is an upper bound. */
  approximate: boolean;
  /** Reason the estimate could not be produced. */
  unavailableReason: string | null;
}
