import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Compass } from "lucide-react";

import { Distribution } from "@/components/dashboard/distribution";
import { Figures } from "@/components/dashboard/figures";
import { Pipeline } from "@/components/dashboard/pipeline";
import { CollectionStatus, type SystemStatusResponse } from "@/components/dashboard/system-status";
import { DeadlineRunway } from "@/components/deadline-runway";
import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { CategoryIcon } from "@/components/opportunities/category-badge";
import { PageFrame, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  ApiError,
  apiGet,
  type DashboardResponse,
  type HealthResponse,
  type SourceOut,
  type TaxonomyResponse,
} from "@/lib/api";
import { CATEGORY_SHORT } from "@/lib/categories";
import { DEADLINE_VERB, daysUntil, shortDate, timeAgo } from "@/lib/format";

type Summary = { bookmarked: number; by_status: Record<string, number> };

/** The one line under the title: this week's deadlines, the finding the screen leads with. */
function finding(data: DashboardResponse): string {
  const official = data.deadlines.filter((d) => d.field !== "personal_deadline");
  const week = new Map<string, boolean>();
  for (const d of official) if (daysUntil(d.at) < 7) week.set(d.id, d.is_bookmarked);
  const saved = [...week.values()].filter(Boolean).length;
  const n = week.size;
  if (n > 0) {
    const savedPart = saved === 0 ? "none of them saved" : saved === n ? (n === 1 ? "and you saved it" : "all of them saved") : `${saved} on opportunities you saved`;
    return `${n} ${n === 1 ? "deadline closes" : "deadlines close"} in the next 7 days, ${savedPart}.`;
  }
  const month = new Set(official.map((d) => d.id)).size;
  return month > 0
    ? `Nothing closes this week. ${month} ${month === 1 ? "opportunity has" : "opportunities have"} a deadline in the next 30 days.`
    : "No deadlines in the next 30 days.";
}

async function Dashboard() {
  await connection();
  let data: DashboardResponse;
  let taxonomy: TaxonomyResponse;
  try {
    [data, taxonomy] = await Promise.all([api.dashboard(), api.taxonomy()]);
  } catch (e) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorNote
          title="Could not load the dashboard"
          message={`${e instanceof ApiError ? e.message : "Unknown error."} Check that the API is running.`}
        />
      </>
    );
  }

  // Secondary panels degrade on their own: a failed call blanks its panel, not the screen.
  const [summary, system, sources, health, fieldCounts] = await Promise.all([
    apiGet<Summary>("/api/v1/me/summary").catch(() => null),
    apiGet<SystemStatusResponse>("/api/v1/system/status").catch(() => null),
    api.sources().catch(() => null as SourceOut[] | null),
    api.health().catch(() => null as HealthResponse | null),
    Promise.all(
      taxonomy.tech_fields.map((f) =>
        api
          .opportunities(`?field=${encodeURIComponent(f.value)}&page_size=1`)
          .then((p) => p.total)
          .catch(() => null),
      ),
    ),
  ]);

  const byStatus = summary?.by_status ?? {};
  const tracking = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const submitted = (byStatus.applied ?? 0) + (byStatus.registered ?? 0);
  const weekIds = new Set(
    data.deadlines.filter((d) => d.field !== "personal_deadline" && daysUntil(d.at) < 7).map((d) => d.id),
  );
  const counts = Object.fromEntries(data.category_counts.map((c) => [c.category, c.count]));
  const usedCategories = data.category_counts.filter((c) => c.count > 0).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={finding(data)}
        actions={
          <Button asChild>
            <Link href="/opportunities">
              <Compass aria-hidden /> Discover
            </Link>
          </Button>
        }
      />

      {data.mock_count > 0 && (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="rounded-sm border border-dashed border-control px-1.5 text-xs font-medium">Sample</span>
          {data.mock_count} fictional sample records are loaded for testing.
          <Link href="/settings#data" className="font-medium text-foreground underline-offset-4 hover:underline">
            How to remove them
          </Link>
        </p>
      )}

      <div className="grid gap-4">
        <Figures
          items={[
            {
              label: "Open opportunities",
              value: data.total_active,
              note: `in ${usedCategories} of 8 categories`,
              href: "/opportunities",
            },
            {
              label: "Closing within 7 days",
              value: weekIds.size,
              note: weekIds.size ? "official deadlines" : "nothing this week",
              href: "/opportunities?deadline_within_days=7",
            },
            { label: "Saved", value: summary?.bookmarked ?? 0, note: "bookmarked by you", href: "/saved" },
            {
              label: "Tracking",
              value: tracking,
              note: tracking ? `${submitted} applied or registered` : "no statuses set",
              href: "/tracking",
            },
            {
              label: "Needs review",
              value: data.needs_review,
              note: data.needs_review ? "uncertain AI details" : "queue is clear",
              href: "/review",
            },
          ]}
        />

        <Card aria-labelledby="runway-title">
          <CardHeader>
            <CardTitle id="runway-title">Deadline runway</CardTitle>
            <CardMeta>Next 30 days</CardMeta>
          </CardHeader>
          <DeadlineRunway deadlines={data.deadlines} />
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
              <Link href="/tracking" className="text-sm font-medium underline-offset-4 hover:underline">
                Open board
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              {summary ? (
                <div className="flex h-full flex-col">
                  <Pipeline byStatus={byStatus} />
                  <p className="mt-auto border-t border-rule pt-3 text-sm text-muted-foreground">
                    <span className="tabular font-medium text-foreground">{summary.bookmarked}</span> saved,{" "}
                    <span className="tabular font-medium text-foreground">{tracking}</span> with a status
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Your tracking summary could not be loaded.</p>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Collection</CardTitle>
              <Link href="/sources" className="text-sm font-medium underline-offset-4 hover:underline">
                Sources
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <CollectionStatus health={health} system={system} sources={sources} />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Where they fall</CardTitle>
              <CardMeta>{data.total_active} open</CardMeta>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <Distribution
                categories={taxonomy.categories.map((c) => ({
                  value: c.value,
                  label: CATEGORY_SHORT[c.value] ?? c.label,
                  count: counts[c.value] ?? 0,
                }))}
                fields={taxonomy.tech_fields.map((f, i) => ({ value: f.value, label: f.label, count: fieldCounts[i] }))}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recently collected</CardTitle>
            <Link href="/opportunities?sort=newest" className="text-sm font-medium underline-offset-4 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recent.length === 0 ? (
              <EmptyState
                title="Nothing collected yet"
                body="Add a source you trust and activate it. New opportunities from it appear here."
                action={{ href: "/sources", label: "Add a source" }}
              />
            ) : (
              <ul className="divide-y divide-rule">
                {data.recent.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-0.5 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-2 lg:grid-cols-[minmax(0,1fr)_14rem_9rem_6rem]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CategoryIcon category={o.category} />
                        <span className="truncate text-sm font-medium">{o.title}</span>
                      </span>
                      <span className="hidden truncate text-sm text-muted-foreground lg:block">{o.organizer ?? "Organizer not stated"}</span>
                      <span className="hidden text-right text-sm lg:block">
                        {o.next_deadline ? (
                          <>
                            <span className="text-muted-foreground">{DEADLINE_VERB[o.next_deadline.field]} </span>
                            {shortDate(o.next_deadline.at, o.date_precision[o.next_deadline.field], o.timezone, false).replace(/, \d{2}:\d{2}$/, "")}
                          </>
                        ) : (
                          <span className="text-muted-foreground">No deadline</span>
                        )}
                      </span>
                      <span className="tabular text-right text-xs text-muted-foreground">
                        {o.first_collected_at ? timeAgo(o.first_collected_at) : "–"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading the dashboard" className="grid gap-4">
      <PageHeader title="Dashboard" className="mb-2" />
      <Skeleton className="-mt-4 mb-2 h-4 w-96 max-w-full" />
      <Skeleton className="h-[5.5rem] rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PageFrame>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </PageFrame>
  );
}
