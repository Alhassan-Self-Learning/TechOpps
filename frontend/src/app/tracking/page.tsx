import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PIPELINE } from "@/components/dashboard/pipeline";
import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { CategoryBadge, SampleBadge } from "@/components/opportunities/category-badge";
import { PageFrame, PageHeader } from "@/components/page-header";
import { BookmarkButton } from "@/components/tracking/bookmark-button";
import { StatusSelect } from "@/components/tracking/status-select";
import { TRACKING_STATUSES } from "@/lib/tracking";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type OpportunityListItem, type Page } from "@/lib/api";
import { DATE_FIELD_LABELS, DEADLINE_VERB, daysUntil, label, relativeDays, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tracking" };

function TrackCard({ o }: { o: OpportunityListItem }) {
  const nd = o.next_deadline;
  const target = o.user.personal_deadline;
  return (
    <li className="group relative min-w-0 rounded-lg border bg-surface p-3.5 transition-[border-color] duration-[var(--dur-1)] hover:border-control">
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={o.category} subtype={o.subtype} />
        <div className="-mt-1.5 -mr-1.5">
          <BookmarkButton id={o.id} initial={o.user.is_bookmarked} compact title={o.title} />
        </div>
      </div>
      <h3 className="mt-0.5 text-sm leading-snug font-semibold">
        <Link
          href={`/opportunities/${o.id}`}
          className="after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
        >
          {o.title}
        </Link>
      </h3>
      {o.organizer && <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.organizer}</p>}

      <dl className="mt-2.5 grid gap-1 text-xs">
        {nd && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{DEADLINE_VERB[nd.field]}</dt>
            <dd>
              {shortDate(nd.at, o.date_precision[nd.field] ?? "datetime", o.timezone, false).replace(/, \d{2}:\d{2}$/, "")}
              <span className={cn(daysUntil(nd.at) <= 7 ? "font-medium text-urgent" : "text-muted-foreground")}> · {relativeDays(nd.at)}</span>
            </dd>
          </div>
        )}
        {target && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{DATE_FIELD_LABELS.personal_deadline}</dt>
            <dd>{shortDate(target, "datetime", null, false)}</dd>
          </div>
        )}
        {!nd && !target && <p className="text-muted-foreground">No deadline ahead</p>}
      </dl>

      {o.user.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{o.user.notes}</p>}

      <div className="mt-3 flex items-center gap-2">
        <StatusSelect id={o.id} initial={o.user.tracking_status} title={o.title} className="flex-1" />
        {o.is_mock && <SampleBadge />}
      </div>
    </li>
  );
}

async function Board() {
  const query = new URLSearchParams({ include_past: "true", page_size: "100", sort: "deadline" });
  TRACKING_STATUSES.forEach((s) => query.append("tracking_status", s));
  let page: Page<OpportunityListItem>;
  try {
    page = await api.opportunities(`?${query}`);
  } catch (e) {
    return <ErrorNote title="Could not load your tracking board" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  if (page.total === 0) {
    return (
      <EmptyState
        title="You are not tracking anything yet"
        body="Set a status such as Interested or Applied on an opportunity, and it appears here in its stage."
        action={{ href: "/saved", label: "Go to saved" }}
      />
    );
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PIPELINE.map((stage) => {
        const items = page.items.filter((o) => o.user.tracking_status && stage.statuses.includes(o.user.tracking_status));
        return (
          <section key={stage.key} id={stage.key} aria-labelledby={`${stage.key}-title`} className="min-w-0 scroll-mt-20 rounded-lg bg-surface-2/70 p-2 glass:bg-surface/40">
            <header className="flex items-baseline justify-between gap-2 px-1.5 pt-1 pb-2.5">
              <div>
                <h2 id={`${stage.key}-title`} className="text-sm font-semibold">
                  {stage.title}
                </h2>
                <p className="text-xs text-muted-foreground">{stage.statuses.map((s) => label(s)).join(", ")}</p>
              </div>
              <span className="tabular text-sm text-muted-foreground">{items.length}</span>
            </header>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-control px-3 py-4 text-xs text-muted-foreground">
                Nothing in this stage.
              </p>
            ) : (
              <ul className="grid gap-2">
                {items.map((o) => (
                  <TrackCard key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Tracking"
        description="Every opportunity you set a status on, by stage, soonest deadline first. Moving one is a status change."
      />
      <Suspense
        fallback={
          <div aria-label="Loading your tracking board" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PIPELINE.map((s) => (
              <Skeleton key={s.key} className="h-72 rounded-lg" />
            ))}
          </div>
        }
      >
        <Board />
      </Suspense>
    </PageFrame>
  );
}
