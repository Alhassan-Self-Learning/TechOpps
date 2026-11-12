import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KanbanSquare } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { OpportunityList, OpportunityRow } from "@/components/opportunities/opportunity-row";
import { PageFrame, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UrlSelect } from "@/components/url-select";
import { api, ApiError, apiGet, type OpportunityListItem, type Page } from "@/lib/api";
import { label } from "@/lib/format";
import type { RawSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved" };

const GROUPS = ["", "interested", "planning", "applied", "registered", "accepted", "rejected", "attended", "completed", "withdrawn"];
const SORTS = ["deadline", "newest", "starts", "title"];

async function SavedList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && GROUPS.includes(sp.status) ? sp.status : "";
  const sort = typeof sp.sort === "string" && SORTS.includes(sp.sort) ? sp.sort : "";
  const query = new URLSearchParams({ bookmarked: "true", include_past: "true", page_size: "100" });
  if (status) query.set("tracking_status", status);
  if (sort) query.set("sort", sort);

  let page: Page<OpportunityListItem>;
  let summary: { bookmarked: number; by_status: Record<string, number> };
  try {
    [page, summary] = await Promise.all([
      api.opportunities(`?${query}`),
      apiGet<{ bookmarked: number; by_status: Record<string, number> }>("/api/v1/me/summary"),
    ]);
  } catch (e) {
    return <ErrorNote title="Could not load your saved list" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  const tabHref = (g: string) => {
    const q = new URLSearchParams();
    if (g) q.set("status", g);
    if (sort) q.set("sort", sort);
    const s = q.toString();
    return s ? `/saved?${s}` : "/saved";
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-border">
        <nav aria-label="Filter by status" className="-mb-px flex max-w-full gap-5 overflow-x-auto">
          {GROUPS.filter((g) => g === "" || summary.by_status[g]).map((g) => {
            const active = g === status;
            const count = g ? summary.by_status[g] : summary.bookmarked;
            return (
              <Link
                key={g || "all"}
                href={tabHref(g)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-sm whitespace-nowrap transition-colors",
                  active ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {g ? label(g) : "All saved"}
                <span className="tabular text-muted-foreground">{count}</span>
              </Link>
            );
          })}
        </nav>
        <div className="pb-2">
          <UrlSelect
            name="sort"
            label="Sort"
            options={[
              { value: "", label: "Soonest deadline" },
              { value: "newest", label: "Newest" },
              { value: "starts", label: "Start date" },
              { value: "title", label: "Title A–Z" },
            ]}
          />
        </div>
      </div>
      {page.total === 0 ? (
        <EmptyState
          title={status ? `Nothing marked as ${label(status).toLowerCase()}` : "No saved opportunities"}
          body="Press the bookmark on any opportunity to keep it here, then set a status to follow your application."
          action={{ href: "/opportunities", label: "Discover opportunities" }}
        />
      ) : (
        <OpportunityList>
          {page.items.map((item) => (
            <OpportunityRow key={item.id} item={item} showStatusControl />
          ))}
        </OpportunityList>
      )}
    </>
  );
}

export default function SavedPage({ searchParams }: PageProps<"/saved">) {
  return (
    <PageFrame className="max-w-[60rem]">
      <PageHeader
        title="Saved"
        description="Opportunities you bookmarked, including past ones. Change a status here or on the opportunity."
        actions={
          <Button asChild variant="outline">
            <Link href="/tracking">
              <KanbanSquare aria-hidden /> Tracking board
            </Link>
          </Button>
        }
      />
      <Suspense
        fallback={
          <div aria-label="Loading your saved list">
            <Skeleton className="mb-3 h-10" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        }
      >
        <SavedList searchParams={searchParams} />
      </Suspense>
    </PageFrame>
  );
}
