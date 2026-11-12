import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { PageFrame, PageHeader } from "@/components/page-header";
import { AddSourceButton } from "@/components/sources/add-source";
import { RunStatus } from "@/components/sources/run-status";
import { SourceActions } from "@/components/sources/source-actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type SourceOut } from "@/lib/api";
import { formatDate, label, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sources" };

const COLS = "lg:grid-cols-[minmax(0,1fr)_6rem_9.5rem_9rem_17rem]";

function SourceRow({ s }: { s: SourceOut }) {
  const failing = s.consecutive_failures > 0;
  return (
    <li className={cn("relative grid gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-surface-2/40", COLS)}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/sources/${s.id}`}
            className="font-medium underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
          >
            {s.name}
          </Link>
          <span className="text-xs text-muted-foreground">{label(s.kind)}</span>
          <span className="lg:hidden">
            <Badge tone={s.is_active ? "ok" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge>
          </span>
        </p>
        {s.url && <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{s.url}</p>}
        {failing && s.last_error && (
          <p className="mt-1 text-[0.8125rem] text-danger">
            Failed {s.consecutive_failures} {s.consecutive_failures === 1 ? "time" : "times"} in a row: {s.last_error}
          </p>
        )}
        <p className="tabular mt-1 text-[0.8125rem] text-muted-foreground">
          {s.raw_items.toLocaleString("en-GB")} collected · {s.pending_items.toLocaleString("en-GB")} waiting · {s.opportunities.toLocaleString("en-GB")}{" "}
          {s.opportunities === 1 ? "opportunity" : "opportunities"}
        </p>
      </div>

      <div className="hidden lg:block">
        <Badge tone={s.is_active ? "ok" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge>
      </div>
      <div className="text-[0.8125rem] leading-tight lg:text-sm">
        <span className="text-muted-foreground lg:hidden">Last run: </span>
        <RunStatus status={s.last_run_status} />
        {s.last_run_at && (
          <span className="tabular text-muted-foreground lg:block" title={formatDate(s.last_run_at)}>
            <span className="lg:hidden">, </span>
            {timeAgo(s.last_run_at)}
          </span>
        )}
      </div>
      <div className="hidden text-sm text-muted-foreground lg:block">
        {s.kind === "manual" ? "Pasted by you" : !s.is_active ? "–" : s.next_run_at ? formatDate(s.next_run_at).replace(/ \d{4},/, ",") : "On the next tick"}
      </div>
      <SourceActions source={s} className="lg:justify-self-end" />
    </li>
  );
}

async function SourceList() {
  let sources: SourceOut[];
  try {
    sources = await api.sources();
  } catch (e) {
    return <ErrorNote title="Could not load sources" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  if (sources.length === 0) {
    return (
      <EmptyState
        title="No sources yet"
        body="Add a feed, API or page you trust with Add source. It stays inactive until you turn it on."
      />
    );
  }
  const active = sources.filter((s) => s.is_active).length;
  const failing = sources.filter((s) => s.consecutive_failures > 0).length;
  return (
    <>
      <p className="tabular mb-3 text-sm text-muted-foreground" aria-live="polite">
        {sources.length} {sources.length === 1 ? "source" : "sources"} · {active} active
        {failing > 0 && <span className="font-medium text-danger"> · {failing} failing</span>}
      </p>
      <div className="overflow-hidden rounded-lg border bg-surface">
        <div aria-hidden className={cn("hidden gap-x-5 border-b border-rule px-5 py-2.5 text-xs text-muted-foreground lg:grid", COLS)}>
          <span>Source</span>
          <span>State</span>
          <span>Last run</span>
          <span>Next check</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-rule">
          {sources.map((s) => (
            <SourceRow key={s.id} s={s} />
          ))}
        </ul>
      </div>
    </>
  );
}

export default function SourcesPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Sources"
        description="The feeds, APIs and pages TechOpps collects from. You choose every one; nothing is collected until you activate it."
        actions={<AddSourceButton />}
      />
      <Suspense
        fallback={
          <div aria-label="Loading sources">
            <Skeleton className="mb-3 h-4 w-48" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <SourceList />
      </Suspense>
    </PageFrame>
  );
}
