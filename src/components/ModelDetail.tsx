import { X } from "lucide-react";
import { useEffect } from "react";
import { DataValue, Panel, Tag } from "@/components/kit";
import { ValueScoreInfo } from "@/components/ValueScoreInfo";
import { estimateCost, valueScore } from "@/services/modelService";
import { formatUsd } from "@/lib/format";
import type { Model } from "@/types/model";

const SAMPLE = { inputTokens: 10_000_000, outputTokens: 2_000_000 };

export function ModelDetail({ model, onClose }: { model: Model | null; onClose: () => void }) {
  useEffect(() => {
    if (!model) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [model, onClose]);

  if (!model) return null;
  const score = valueScore(model);
  const estimate = estimateCost(model, SAMPLE);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name} details`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <Panel
        glow
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none sm:rounded-2xl"
      >
        <div onClick={(e) => e.stopPropagation()} className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-soft uppercase">
                {model.provider}
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {model.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Input price / 1M">
              <DataValue metric={model.inputPrice} />
            </Field>
            <Field label="Output price / 1M">
              <DataValue metric={model.outputPrice} />
            </Field>
            <Field label="Context window">
              <DataValue metric={model.context} />
            </Field>
            <Field label="Max output">
              <DataValue metric={model.maxOutput} />
            </Field>
            <Field label="Speed">
              <DataValue metric={model.speed} />
            </Field>
            <Field label="Quality index">
              <DataValue metric={model.quality} />
            </Field>
            <Field label="Dataset value">
              <DataValue metric={model.value} />
            </Field>
            <Field label="ModelPulse Value Score">
              <span className="num text-violet-soft">
                {score == null ? <span className="text-muted-foreground/60">N/A</span> : score}
              </span>
            </Field>
            <Field label="Provider">
              <span className="text-foreground">{model.provider}</span>
            </Field>
          </dl>

          <div className="mt-5 rounded-xl border border-border bg-surface-2/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                Sample workload: 10M input + 2M output tokens / month
              </p>
              {estimate.approximate && <Tag tone="warn">Approximate</Tag>}
            </div>
            {estimate.total == null ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Cost estimate unavailable — {estimate.unavailableReason}
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <Field label="Input cost">
                  <span className="num text-foreground">{formatUsd(estimate.inputCost)}</span>
                </Field>
                <Field label="Output cost">
                  <span className="num text-foreground">{formatUsd(estimate.outputCost)}</span>
                </Field>
                <Field label="Total / month">
                  <span className="num text-violet-soft">{formatUsd(estimate.total)}</span>
                </Field>
              </div>
            )}
            {estimate.approximate && estimate.total != null && (
              <p className="mt-3 text-xs text-muted-foreground">
                The dataset only publishes “below $0.01 per 1M tokens” for this model, so this figure
                is an upper bound, not an exact price.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Fields shown exactly as published in the dataset. N/A means the source has no value.
            </p>
            <ValueScoreInfo />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/50 p-3">
      <dt className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
