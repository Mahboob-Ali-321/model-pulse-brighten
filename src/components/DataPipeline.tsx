import { ArrowDown, ArrowRight, Braces, Globe, Sparkles, Target, Waypoints } from "lucide-react";
import { Panel } from "@/components/kit";
import { Reveal } from "@/components/motion";

const STEPS = [
  { label: "TokenCost", detail: "Public pricing pages", icon: Globe },
  { label: "Bright Data Scraper", detail: "Reliable extraction", icon: Waypoints },
  { label: "Structured Model Data", detail: "Normalized JSON", icon: Braces },
  { label: "ModelPulse", detail: "Scoring & analytics", icon: Sparkles },
  { label: "Model Recommendation", detail: "Workload-fit answer", icon: Target },
];

export function DataPipeline() {
  return (
    <Panel className="relative overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
        <Reveal className="lg:max-w-xs" motion="left">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-violet-soft uppercase">
            Data pipeline
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            From raw web data to a decision
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Bright Data handles reliable web data extraction. ModelPulse turns that data into
            actionable model-selection intelligence.
          </p>
          <p className="mt-4 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Raw web data → Structured data → Analytics → Decision
          </p>
        </Reveal>

        <ol className="relative flex flex-1 flex-col gap-2 lg:flex-row lg:items-stretch">
          <span
            className="mp-flow pointer-events-none absolute top-1/2 right-0 left-0 hidden h-px lg:block"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <Reveal
              as="li"
              key={step.label}
              delay={i * 130}
              className="flex flex-1 items-center gap-2 lg:flex-col lg:gap-2"
            >
              <div className="lift min-w-0 flex-1 rounded-xl border border-border bg-surface/60 p-3 text-center hover:border-violet/45 lg:w-full">
                <step.icon className="mp-pulse-soft mx-auto mb-2 size-4 text-violet-soft" aria-hidden />
                <p className="text-xs font-semibold text-foreground">{step.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{step.detail}</p>
              </div>
              {i < STEPS.length - 1 && (
                <>
                  <ArrowDown
                    className="size-4 shrink-0 text-muted-foreground/60 lg:hidden"
                    aria-hidden
                  />
                  <ArrowRight
                    className="hidden size-4 shrink-0 text-muted-foreground/60 lg:block"
                    aria-hidden
                  />
                </>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
