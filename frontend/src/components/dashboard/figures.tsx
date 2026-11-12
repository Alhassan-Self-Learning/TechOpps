import Link from "next/link";

import { cn } from "@/lib/utils";

export type Figure = { label: string; value: number; note?: string; href: string };

/**
 * Headline counts as one container split by hairlines, label over value. Each cell links to the
 * list it counts. A zero prints as a zero, in grey.
 */
export function Figures({ items }: { items: Figure[] }) {
  return (
    <nav aria-label="Summary" className="overflow-hidden rounded-lg border bg-surface">
      {/* 1px gaps over the rule colour draw the hairlines between cells at every column count. */}
      <ul className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 lg:grid-cols-5">
        {items.map((f, i) => (
          <li
            key={f.label}
            className={cn(
              "bg-surface",
              // Odd count: the last cell takes the row so no half-row is left empty.
              i === items.length - 1 && items.length % 2 === 1 && "col-span-2 sm:col-span-1",
              i === items.length - 1 && items.length % 3 === 2 && "sm:col-span-2 lg:col-span-1",
            )}
          >
            <Link
              href={f.href}
              className="group block h-full px-5 py-4 transition-colors duration-[var(--dur-1)] hover:bg-surface-2/60"
            >
              <span className="block text-[0.8125rem] text-muted-foreground group-hover:text-foreground">{f.label}</span>
              <span className={cn("tabular mt-1 block text-2xl leading-none font-medium", f.value === 0 && "text-muted-foreground")}>
                {f.value.toLocaleString("en-GB")}
              </span>
              {f.note && <span className="mt-1.5 block truncate text-xs text-muted-foreground">{f.note}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
