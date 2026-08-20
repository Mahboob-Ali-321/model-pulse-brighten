import { HelpCircle, X } from "lucide-react";
import { useState } from "react";
import { Panel } from "@/components/kit";

export function ValueScoreInfo({ label = "How is this calculated?" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <HelpCircle className="size-3.5" aria-hidden />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How the ModelPulse Value Score is calculated"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <Panel
            glow
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
            // eslint-disable-next-line
          >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-foreground">ModelPulse Value Score</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This is <strong className="text-foreground">our own derived metric</strong>, not an
                  official benchmark and not an endorsement by any model provider.
                </p>
                <p>
                  When the dataset publishes a <code className="num text-violet-soft">value</code>{" "}
                  figure for a model, we show that figure unchanged.
                </p>
                <p>
                  When it does not, and the dataset has both a quality index and a usable price, we
                  derive a score:
                </p>
                <pre className="num overflow-x-auto rounded-xl border border-border bg-surface-2/70 p-3 text-xs text-foreground">
{`blended price = 0.7 × input $/1M + 0.3 × output $/1M
score = quality index ÷ blended price`}
                </pre>
                <p>
                  If quality or price is missing, no score is produced and the model shows{" "}
                  <span className="num">N/A</span>. We never invent quality, speed or benchmark
                  values.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
