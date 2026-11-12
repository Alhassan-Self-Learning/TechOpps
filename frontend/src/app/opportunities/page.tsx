import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import {
  CategoryBar,
  DiscoverShell,
  FilterRail,
  ResultsFrame,
  ResultsToolbar,
  SearchBar,
} from "@/components/opportunities/filter-panel";
import { OpportunityList, OpportunityRow } from "@/components/opportunities/opportunity-row";
import { Pagination } from "@/components/opportunities/pagination";
import { PageFrame, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type OpportunityListItem, type Page, type TaxonomyResponse } from "@/lib/api";
import { activeFilterCount, toURLSearchParams, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Discover" };

async function Discover({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = toURLSearchParams(await searchParams);
  const query = params.toString();
  let taxonomy: TaxonomyResponse;
  let page: Page<OpportunityListItem>;
  try {
    [taxonomy, page] = await Promise.all([api.taxonomy(), api.opportunities(query ? `?${query}` : "")]);
  } catch (e) {
    return <ErrorNote title="Could not load opportunities" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  const filtered = activeFilterCount(params) > 0;

  return (
    <DiscoverShell>
      <div className="grid gap-3">
        <SearchBar taxonomy={taxonomy} />
        <CategoryBar taxonomy={taxonomy} />
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[14.5rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Filters" className="hidden md:block">
          <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto pr-1">
            <FilterRail taxonomy={taxonomy} />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <ResultsToolbar taxonomy={taxonomy} total={page.total} />
          <ResultsFrame>
            {page.total === 0 ? (
              filtered ? (
                <EmptyState
                  className="mt-3"
                  title="No opportunities match these filters"
                  body="Remove a filter or widen the date range. Past opportunities stay hidden unless you include them under Also show."
                />
              ) : (
                <EmptyState
                  className="mt-3"
                  title="No opportunities yet"
                  body="Add and activate a source to start collecting. To try the interface first, load the labelled sample data (see Settings)."
                  action={{ href: "/sources", label: "Go to sources" }}
                />
              )
            ) : (
              <>
                <OpportunityList className="mt-3">
                  {page.items.map((item) => (
                    <OpportunityRow key={item.id} item={item} />
                  ))}
                </OpportunityList>
                <Pagination page={page.page} pageSize={page.page_size} total={page.total} params={params} basePath="/opportunities" />
              </>
            )}
          </ResultsFrame>
        </section>
      </div>
    </DiscoverShell>
  );
}

function DiscoverSkeleton() {
  return (
    <div aria-label="Loading opportunities">
      <Skeleton className="h-11 rounded-md" />
      <div className="mt-3 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-5 grid gap-6 md:grid-cols-[14.5rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <Skeleton className="hidden h-96 md:block" />
        <div>
          <Skeleton className="h-8 w-48" />
          <div className="mt-3 overflow-hidden rounded-lg border bg-surface">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-b border-rule px-5 py-4 last:border-b-0">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2.5 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpportunitiesPage({ searchParams }: PageProps<"/opportunities">) {
  return (
    <PageFrame>
      <PageHeader title="Discover" description="Everything collected from your sources that has not passed yet." />
      <Suspense fallback={<DiscoverSkeleton />}>
        <Discover searchParams={searchParams} />
      </Suspense>
    </PageFrame>
  );
}
