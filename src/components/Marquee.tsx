import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Presentation-only infinite marquee.
 * Renders the same children twice and slides the track by -50% so the loop
 * is seamless. Pure CSS transform — no JS animation loop.
 */
export function Marquee({
  children,
  className,
  speed = 40,
  gap = "1rem",
  direction = "left",
}: {
  children: ReactNode;
  className?: string;
  /** Seconds for one full loop. Slower = larger. */
  speed?: number;
  gap?: string;
  direction?: "left" | "right";
}) {
  return (
    <div
      className={cn("mp-marquee", className)}
      data-direction={direction}
      style={
        {
          "--mp-speed": `${speed}s`,
          "--mp-gap": gap,
        } as React.CSSProperties
      }
    >
      <div className="mp-marquee-track">
        <div className="flex shrink-0 items-stretch gap-[var(--mp-gap)] pe-[var(--mp-gap)]">
          {children}
        </div>
        <div className="flex shrink-0 items-stretch gap-[var(--mp-gap)]" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
