"use client";

import { useState } from "react";
import Link from "next/link";

import { CategoryIcon } from "@/components/opportunities/category-badge";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

type Row = { value: string; label: string; count: number | null };

/**
 * How the open opportunities divide up, by category or by technology field. A ranked list with
 * a 2px bar under each label; grey, the largest in ink. Each row opens the filtered list.
 */
export function Distribution({ categories, fields }: { categories: Row[]; fields: Row[] }) {
  const [by, setBy] = useState<"category" | "field">("category");
  const rows = by === "category" ? categories : [...fields].sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
  const max = Math.max(1, ...rows.map((r) => r.count ?? 0));
  const top = Math.max(...rows.map((r) => r.count ?? 0));
  return (
    <div>
      <Segmented
        legend="Group by"
        hideLegend
        size="sm"
        value={by}
        onChange={setBy}
        options={[
          { value: "category", label: "Category" },
          { value: "field", label: "Technology field" },
        ]}
      />
      <ul className="mt-2.5 grid">
        {rows.map((r) => (
          <li key={r.value}>
            <Link
              href={`/opportunities?${by}=${r.value}`}
              className="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-sm">
                {by === "category" && <CategoryIcon category={r.value} />}
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className={cn("tabular", r.count ? "" : "text-muted-foreground")}>
                  {r.count === null ? "–" : r.count}
                </span>
              </span>
              <span aria-hidden className="mt-1 block h-0.5 rounded-full bg-surface-2">
                <span
                  className={cn("block h-full rounded-full", r.count === top && top > 0 ? "bg-foreground/80" : "bg-control")}
                  style={{ width: `${((r.count ?? 0) / max) * 100}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
