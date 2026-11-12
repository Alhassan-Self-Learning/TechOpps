import Link from "next/link";

import { label } from "@/lib/format";

/** Display grouping only: the nine tracking statuses and their meaning are unchanged. */
export const PIPELINE: { key: string; title: string; statuses: string[] }[] = [
  { key: "considering", title: "Considering", statuses: ["interested", "planning"] },
  { key: "submitted", title: "Applied or registered", statuses: ["applied", "registered"] },
  { key: "outcome", title: "Decided", statuses: ["accepted", "rejected", "withdrawn"] },
  { key: "done", title: "Done", statuses: ["attended", "completed"] },
];

/** Where your applications stand: four stages, each with its count and the statuses inside it. */
export function Pipeline({ byStatus }: { byStatus: Record<string, number> }) {
  const groups = PIPELINE.map((g) => ({
    ...g,
    count: g.statuses.reduce((n, s) => n + (byStatus[s] ?? 0), 0),
    parts: g.statuses.filter((s) => byStatus[s]).map((s) => `${label(s)} ${byStatus[s]}`),
  }));
  const max = Math.max(1, ...groups.map((g) => g.count));
  return (
    <ul className="grid gap-1">
      {groups.map((g) => (
        <li key={g.key}>
          <Link href={`/tracking#${g.key}`} className="-mx-2 block rounded-md px-2 py-2 transition-colors hover:bg-surface-2">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span>{g.title}</span>
              <span className={g.count ? "tabular font-medium" : "tabular text-muted-foreground"}>{g.count}</span>
            </span>
            <span aria-hidden className="mt-1.5 block h-0.5 rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-foreground/70"
                style={{ width: `${(g.count / max) * 100}%` }}
              />
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {g.parts.length ? g.parts.join(" · ") : "None yet"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
