import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children when scrolled into view.
 * Purely presentational — no data or logic depends on it.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  motion = "up",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  motion?: "up" | "left" | "zoom";
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-motion={motion}
      style={{ "--mp-delay": `${delay}ms` } as React.CSSProperties}
      className={cn("reveal", visible && "is-visible", className)}
    >
      {children}
    </Tag>
  );
}

/** Eases a number up to its target once mounted. Display-only. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/** Animates the leading integer of a formatted string, keeping suffixes intact. */
export function CountUpNumber({ value, className }: { value: number; className?: string }) {
  const current = useCountUp(value);
  return <span className={className}>{Math.round(current).toLocaleString()}</span>;
}
