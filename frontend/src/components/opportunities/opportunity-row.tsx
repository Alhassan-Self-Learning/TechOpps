import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/tracking/bookmark-button";
import { StatusSelect } from "@/components/tracking/status-select";
import type { OpportunityListItem } from "@/lib/api";
import { DEADLINE_VERB, daysUntil, label, relativeDays, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge, ReviewBadge, SampleBadge } from "./category-badge";
import { DeadlineBlock } from "./deadline-block";
import { StatusPill, TrackingPill } from "./status-pill";

/**
 * One opportunity in a list. Reading order: what kind, what it is, who runs it and how, what
 * it covers; the next deadline on the right. The whole row opens the opportunity; the save
 * button and status control sit above that link.
 */
export function OpportunityRow({
  item,
  showStatusControl = false,
}: {
  item: OpportunityListItem;
  /** Saved list: change the tracking status in place instead of showing it as a pill. */
  showStatusControl?: boolean;
}) {
  const place = item.delivery_mode === "online" ? null : item.location_text || item.city || null;
  const meta = [
    item.organizer,
    [item.delivery_mode && label(item.delivery_mode), place].filter(Boolean).join(", "),
    item.cost_type && label(item.cost_type),
    item.skill_level && label(item.skill_level),
  ].filter(Boolean) as string[];
  const fields = item.tech_fields.slice(0, 3);
  const more = item.tech_fields.length - fields.length;
  const nd = item.next_deadline;
  const urgent = nd ? daysUntil(nd.at) <= 7 : false;

  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-rule px-4 py-4 transition-colors duration-[var(--dur-1)] last:border-b-0 hover:bg-surface-2/50 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto] sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <CategoryBadge category={item.category} subtype={item.subtype} />
          {item.is_mock && <SampleBadge />}
          {item.needs_review && <ReviewBadge />}
        </div>
        <h3 className="mt-1.5 text-[0.9375rem] leading-snug font-semibold">
          <Link
            href={`/opportunities/${item.id}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:after:rounded-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
          >
            {item.title}
          </Link>
        </h3>
        {meta.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-1.5 text-[0.8125rem] text-muted-foreground">
            {meta.map((m, i) => (
              <span key={i} className="min-w-0">
                {i > 0 && <span aria-hidden className="pr-1.5 text-faint">·</span>}
                {m}
              </span>
            ))}
          </p>
        )}

        {/* Phone: the deadline joins the text column instead of taking its own. */}
        <p className="mt-1.5 text-[0.8125rem] sm:hidden">
          {nd ? (
            <>
              <span className="text-muted-foreground">{DEADLINE_VERB[nd.field]} </span>
              <span className="font-medium">{shortDate(nd.at, item.date_precision[nd.field] ?? "datetime", item.timezone, false)}</span>
              <span className={cn("tabular", urgent ? "font-medium text-urgent" : "text-muted-foreground")}> · {relativeDays(nd.at)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No deadline stated</span>
          )}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <StatusPill status={item.registration_status} />
          {!showStatusControl && item.user.tracking_status && <TrackingPill status={item.user.tracking_status} />}
          {fields.map((f) => (
            <Badge key={f.value} tone="neutral" className="font-normal text-muted-foreground">
              {f.label}
            </Badge>
          ))}
          {more > 0 && (
            <span className="text-xs text-muted-foreground" title={item.tech_fields.slice(3).map((f) => f.label).join(", ")}>
              +{more} more
            </span>
          )}
        </div>
      </div>

      <div className="hidden pt-0.5 sm:block">
        {nd ? (
          <DeadlineBlock field={nd.field} at={nd.at} precision={item.date_precision[nd.field]} timeZone={item.timezone} />
        ) : (
          <p className="text-right text-xs text-muted-foreground">
            No deadline
            <br />
            stated
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <BookmarkButton id={item.id} initial={item.user.is_bookmarked} compact title={item.title} />
        {showStatusControl && (
          <StatusSelect id={item.id} initial={item.user.tracking_status} title={item.title} className="w-36" />
        )}
      </div>
    </li>
  );
}

/** Frame for a list of rows. */
export function OpportunityList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("overflow-hidden rounded-lg border bg-surface", className)}>{children}</ul>;
}
