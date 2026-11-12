import { DEADLINE_VERB, daysUntil, formatDate, relativeDays, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The single most actionable date for a listing: verb, date, and time left.
 * Inside seven days the time left turns amber; the date itself stays in ink.
 */
export function DeadlineBlock({
  field,
  at,
  precision,
  timeZone,
  align = "right",
}: {
  field: string;
  at: string;
  precision?: "date" | "datetime";
  timeZone?: string | null;
  align?: "left" | "right";
}) {
  const days = daysUntil(at);
  const urgent = days <= 7;
  const full = formatDate(at, precision ?? "datetime", timeZone);
  return (
    <div className={cn("leading-tight", align === "right" ? "text-right" : "text-left")}>
      <p className="text-xs text-muted-foreground">{DEADLINE_VERB[field] ?? "Due"}</p>
      <p className="mt-0.5 text-sm font-medium whitespace-nowrap">
        <time dateTime={at} title={full}>
          {shortDate(at, precision ?? "datetime", timeZone, false)}
        </time>
      </p>
      <p className={cn("tabular mt-0.5 text-xs whitespace-nowrap", urgent ? "font-medium text-urgent" : "text-muted-foreground")}>
        {relativeDays(at)}
      </p>
    </div>
  );
}
