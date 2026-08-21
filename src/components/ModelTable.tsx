import { ArrowUpRight } from "lucide-react";
import { DataValue, Tag } from "@/components/kit";
import { valueScore } from "@/services/modelService";
import type { Model } from "@/types/model";
import { cn } from "@/lib/utils";

export type BadgeKind = "value" | "cheapest" | "fastest" | "quality" | "context";

const BADGE_LABEL: Record<BadgeKind, string> = {
  value: "Best Value",
  cheapest: "Lowest Cost",
  fastest: "Fastest",
  quality: "Highest Quality",
  context: "Largest Context",
};

export interface ModelTableProps {
  models: Model[];
  badges?: Record<string, BadgeKind[]>;
  onSelect: (model: Model) => void;
  showMaxOutput?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (model: Model) => void;
  selectionLimitReached?: boolean;
  /** Presentational only: staggers row entrance when the table appears. */
  animateRows?: boolean;
}

export function ModelTable({
  models,
  badges,
  onSelect,
  showMaxOutput = false,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  selectionLimitReached = false,
  animateRows = false,
}: ModelTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {selectable && <th className="w-10 px-3 py-3" />}
            <Th className="min-w-[220px]">Model</Th>
            <Th>Provider</Th>
            <Th align="right">Input / 1M</Th>
            <Th align="right">Output / 1M</Th>
            <Th align="right">Context</Th>
            {showMaxOutput && <Th align="right">Max Output</Th>}
            <Th align="right">Speed</Th>
            <Th align="right">Quality</Th>
            <Th align="right">Value</Th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {models.map((model, rowIndex) => {
            const score = valueScore(model);
            const isDerived = model.value.value == null && score != null;
            const selected = selectedIds.includes(model.id);
            return (
              <tr
                key={model.id}
                style={
                  animateRows
                    ? ({ "--mp-delay": `${Math.min(rowIndex, 12) * 45}ms` } as React.CSSProperties)
                    : undefined
                }
                className={cn(
                  "group border-b border-border/60 transition-all duration-300 last:border-0",
                  "hover:bg-surface-2/60 hover:shadow-[inset_3px_0_0_0_var(--violet)]",
                  selected && "bg-violet/10",
                  animateRows && "mp-enter",
                )}
              >
                {selectable && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selected && selectionLimitReached}
                      onChange={() => onToggleSelect?.(model)}
                      aria-label={`Select ${model.name} for comparison`}
                      className="size-4 accent-[var(--violet)]"
                    />
                  </td>
                )}
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect(model)}
                    className="text-left font-medium text-foreground transition-colors hover:text-violet-soft"
                  >
                    {model.name}
                  </button>
                  {badges?.[model.id]?.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {badges[model.id]!.map((b) => (
                        <Tag key={b} tone="violet">
                          {BADGE_LABEL[b]}
                        </Tag>
                      ))}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{model.provider}</td>
                <Td>
                  <DataValue metric={model.inputPrice} />
                </Td>
                <Td>
                  <DataValue metric={model.outputPrice} />
                </Td>
                <Td>
                  <DataValue metric={model.context} />
                </Td>
                {showMaxOutput && (
                  <Td>
                    <DataValue metric={model.maxOutput} />
                  </Td>
                )}
                <Td>
                  <DataValue metric={model.speed} />
                </Td>
                <Td>
                  <DataValue metric={model.quality} />
                </Td>
                <Td>
                  {score == null ? (
                    <span className="num text-muted-foreground/60">N/A</span>
                  ) : (
                    <span
                      className="num text-violet-soft"
                      title={
                        isDerived
                          ? "Derived ModelPulse Value Score (dataset has no value field for this model)"
                          : "Value figure as published in the dataset"
                      }
                    >
                      {score}
                      {isDerived && <span className="ml-1 text-[10px] text-muted-foreground">est</span>}
                    </span>
                  )}
                </Td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(model)}
                    aria-label={`View details for ${model.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:border-violet/50 hover:text-foreground focus-visible:opacity-100"
                  >
                    <ArrowUpRight className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-right whitespace-nowrap">{children}</td>;
}
