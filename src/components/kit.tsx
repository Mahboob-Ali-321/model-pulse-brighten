import { type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  glow = false,
}: {
  className?: string;
  children: ReactNode;
  glow?: boolean;
}) {
  return (
    <div className={cn("glass rounded-2xl", glow && "glow-ring", className)}>{children}</div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-violet-soft uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const tagTones = {
  violet: "border-violet/40 bg-violet/12 text-violet-soft",
  neutral: "border-border bg-surface-2/70 text-muted-foreground",
  success: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  warn: "border-chart-4/40 bg-chart-4/10 text-chart-4",
} as const;

export function Tag({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  tone?: keyof typeof tagTones;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap",
        tagTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:brightness-110 glow-ring",
        variant === "outline" &&
          "border border-border bg-surface/60 text-foreground hover:border-violet/50 hover:bg-surface-2",
        variant === "ghost" && "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
    >
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-input bg-surface/70 px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-violet/40 focus:border-violet/60";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, className)} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(controlClass, "appearance-none pr-8", className)}>
      {children}
    </select>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-2/80", className)} />;
}

/** Renders a dataset value, or "N/A" when the dataset has no value. */
export function DataValue({
  metric,
  className,
}: {
  metric: { display: string | null; approximate?: boolean };
  className?: string;
}) {
  if (!metric.display) {
    return <span className={cn("num text-muted-foreground/60", className)}>N/A</span>;
  }
  return (
    <span className={cn("num text-foreground", className)}>
      {metric.display}
      {metric.approximate && (
        <span className="ml-1 text-[10px] text-muted-foreground" title="Exact value not published">
          approx
        </span>
      )}
    </span>
  );
}
