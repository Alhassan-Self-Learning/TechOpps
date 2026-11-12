import type { OpportunityDetail } from "@/lib/api";
import { DATE_FIELD_LABELS, formatDate, relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDERED = [
  "registration_opens_at",
  "registration_deadline",
  "application_deadline",
  "starts_at",
  "ends_at",
] as const;
const DEADLINES = new Set(["registration_deadline", "application_deadline"]);

/**
 * The opportunity's own runway: every stated date on one vertical line in time order, with
 * today placed among them, so "what's next" reads from position. Dates the source never stated
 * are listed as not stated instead of being guessed.
 */
export function KeyDates({ o, now = new Date() }: { o: OpportunityDetail; now?: Date }) {
  const stated = ORDERED.filter((f) => o[f]).map((f) => ({ field: f as string, at: o[f] as string }));
  const missing = ORDERED.filter((f) => !o[f]);
  const nodes = [...stated, { field: "today", at: now.toISOString() }].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div>
      {stated.length === 0 ? (
        <p className="text-sm text-muted-foreground">The source states no dates for this opportunity.</p>
      ) : (
        <ol className="relative">
          {nodes.map((n, i) => {
            const isToday = n.field === "today";
            const past = !isToday && n.at < now.toISOString();
            const deadline = DEADLINES.has(n.field);
            const last = i === nodes.length - 1;
            const precision = o.date_precision[n.field] ?? "datetime";
            return (
              <li key={n.field} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 pb-4 last:pb-0">
                {!last && <span aria-hidden className="absolute top-3 bottom-0 left-[0.5625rem] w-px bg-border" />}
                <span aria-hidden className="relative z-10 grid h-5 place-items-center">
                  {isToday ? (
                    <span className="h-px w-4 bg-foreground" />
                  ) : (
                    <span
                      className={cn(
                        "size-2.5 rounded-full border-2",
                        past ? "border-control bg-surface" : deadline ? "border-signal bg-signal" : "border-signal bg-surface",
                      )}
                    />
                  )}
                </span>
                {isToday ? (
                  <p className="text-xs font-medium leading-5">Today</p>
                ) : (
                  <div className={cn("min-w-0 text-sm leading-5", past && "text-muted-foreground")}>
                    <p className={cn(deadline && !past && "font-medium")}>{DATE_FIELD_LABELS[n.field]}</p>
                    <p className="text-muted-foreground">
                      <time dateTime={n.at}>{formatDate(n.at, precision, o.timezone)}</time>
                      {deadline && !past && (
                        <span className="text-foreground"> · {relativeDays(n.at, now)}</span>
                      )}
                      {past && " · passed"}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {missing.length > 0 && stated.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Not stated: {missing.map((f) => DATE_FIELD_LABELS[f].toLowerCase()).join(", ")}.
        </p>
      )}
      {o.timezone && <p className="mt-1 text-xs text-muted-foreground">Times in {o.timezone}.</p>}
    </div>
  );
}
