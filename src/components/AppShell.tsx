import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, Calculator, Columns3, Compass, Database, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/explorer", label: "Explorer", icon: Compass },
  { to: "/compare", label: "Compare", icon: Columns3 },
  { to: "/calculator", label: "Calculator", icon: Calculator },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function NavLinks({ onNavigate, stacked = false }: { onNavigate?: () => void; stacked?: boolean }) {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className={cn(
            "group relative inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-surface-2 hover:text-foreground",
            "after:absolute after:bottom-1 after:left-3 after:h-px after:w-[calc(100%-1.5rem)] after:origin-left after:scale-x-0 after:bg-violet after:transition-transform after:duration-300 hover:after:scale-x-100",
            stacked && "w-full",
          )}
          activeProps={{
            className: "bg-violet/14 text-foreground ring-1 ring-violet/35 after:scale-x-100",
          }}
        >
          <Icon className="size-4 opacity-80" aria-hidden />
          {label}
        </Link>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="ModelPulse home">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/90 glow-ring transition-transform duration-300 group-hover:scale-105 mp-pulse-soft">
              <Activity className="size-5 text-primary-foreground" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-foreground">
                ModelPulse
              </span>
              <span className="block text-[9px] font-semibold tracking-[0.24em] text-violet-soft uppercase">
                AI Model Intelligence
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
            <NavLinks />
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
              title="Static dataset snapshot collected with Bright Data Scraper Studio. Not a live API connection."
            >
              <Database className="size-3.5 text-violet-soft" aria-hidden />
              Data source: Bright Data Scraper Studio (snapshot)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:border-violet/50 hover:bg-surface-2 lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>

        {open && (
          <nav
            className="animate-in fade-in slide-in-from-top-2 border-t border-border px-4 py-3 duration-300 lg:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1">
              <NavLinks stacked onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">{children}</main>

      <footer className="border-t border-border/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            ModelPulse — pricing, context and quality intelligence for AI workloads. Data sourced via
            Bright Data Scraper Studio.
          </p>
          <p>
            Quality, speed and value figures come from the dataset as published. ModelPulse Value
            Score is a derived metric, not an official benchmark.
          </p>
        </div>
      </footer>
    </div>
  );
}
