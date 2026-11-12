import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The TechOpps mark: a runway. One line (the days ahead), today's tick, and one deadline in the
 * data hue. It repeats the deadline runway on the dashboard.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="6" className="fill-primary" />
      <rect x="5" y="11.25" width="14" height="1.5" rx="0.75" className="fill-primary-foreground opacity-45" />
      <rect x="7" y="7" width="1.75" height="10" rx="0.875" className="fill-primary-foreground" />
      <circle cx="15.5" cy="12" r="2.6" className="fill-signal" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 rounded-md text-[0.9375rem] font-semibold tracking-tight", className)}
    >
      <Mark />
      TechOpps
    </Link>
  );
}
