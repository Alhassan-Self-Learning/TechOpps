import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { ErrorNote } from "@/components/error-note";
import { PageFrame } from "@/components/page-header";
import { ManualItemForm } from "@/components/sources/manual-item-form";
import { RunStatus } from "@/components/sources/run-status";
import { SourceActions } from "@/components/sources/source-actions";
import { SourceForm } from "@/components/sources/source-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type RawItemOut, type SourceDetail } from "@/lib/api";
import { formatDate, label, safeHref } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Source" };

const ITEM_STATUS: Record<RawItemOut["processing_status"], { text: string; tone: "neutral" | "ok" | "danger" | "outline" }> = {
  pending: { text: "Waiting for AI", tone: "neutral" },
  processed: { text: "Processed", tone: "ok" },
  failed: { text: "Processing failed", tone: "danger" },
  skipped: { text: "Not an opportunity", tone: "outline" },
};

const INTERVAL: Record<number, string> = { 60: "Every hour", 360: "Every 6 hours", 720: "Every 12 hours", 1440: "Daily", 10080: "Weekly" };

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let s: SourceDetail;
  let items: RawItemOut[];
  try {
    [s, items] = await Promise.all([api.source(id), api.sourceItems(id)]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return <ErrorNote title="Could not load this source" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  const href = safeHref(s.url);
  const figures = [
    { label: "Collected", value: s.raw_items.toLocaleString("en-GB") },
    { label: "Waiting for AI", value: s.pending_items.toLocaleString("en-GB") },
    { label: "Opportunities", value: s.opportunities.toLocaleString("en-GB") },
    {
      label: "Next check",
      value: s.kind === "manual" ? "–" : !s.is_active ? "Inactive" : s.next_run_at ? formatDate(s.next_run_at).replace(/ \d{4},/, ",") : "Next tick",
      note: s.kind === "manual" ? "Pasted by you" : INTERVAL[s.fetch_interval_minutes] ?? `Every ${s.fetch_interval_minutes} min`,
    },
  ];

  return (
    <>
      <Link href="/sources" className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Sources
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {label(s.kind)}
            <Badge tone={s.is_active ? "ok" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge>
          </p>
          <h1 className="mt-1.5 text-[1.375rem] leading-tight font-semibold tracking-[-0.01em] md:text-2xl">{s.name}</h1>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block max-w-full truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {href}
            </a>
          )}
        </div>
        <SourceActions source={s} showDelete emphasis />
      </header>

      {s.consecutive_failures > 0 && (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <span>
            The last {s.consecutive_failures} {s.consecutive_failures === 1 ? "run has" : "runs have"} failed: {s.last_error}
          </span>
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-rule lg:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="bg-surface px-5 py-3.5">
            <dt className="text-[0.8125rem] text-muted-foreground">{f.label}</dt>
            <dd className="mt-1 text-lg leading-tight font-medium">{f.value}</dd>
            {f.note && <dd className="mt-0.5 text-xs text-muted-foreground">{f.note}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-4">
          {s.kind === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>Add an opportunity by hand</CardTitle>
              </CardHeader>
              <CardContent>
                <ManualItemForm sourceId={s.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Collected items</CardTitle>
              <CardMeta>
                {items.length < s.raw_items ? `Latest ${items.length} of ${s.raw_items}` : `${s.raw_items} total`}
              </CardMeta>
            </CardHeader>
            <CardContent className="pt-0">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-control px-4 py-3 text-sm text-muted-foreground">
                  Nothing collected yet.
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {items.map((i) => {
                    const st = ITEM_STATUS[i.processing_status];
                    return (
                      <li key={i.id} className="py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 font-medium">
                            {i.opportunity_id ? (
                              <Link href={`/opportunities/${i.opportunity_id}`} className="underline-offset-4 hover:underline">
                                {i.title ?? "Untitled item"}
                              </Link>
                            ) : (
                              (i.title ?? "Untitled item")
                            )}
                          </p>
                          <Badge tone={st.tone}>{st.text}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Collected {formatDate(i.collected_at)}
                          {i.source_published_at && `, published ${formatDate(i.source_published_at)}`}
                        </p>
                        {i.content_preview && <p className="mt-1 line-clamp-2 text-muted-foreground">{i.content_preview}</p>}
                        {i.processing_error && <p className="mt-1 text-xs text-danger">{i.processing_error}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {s.kind !== "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>Collection history</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {s.runs.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-control px-4 py-3 text-sm text-muted-foreground">
                    No runs yet. Activate the source, then collect now or wait for the schedule.
                  </p>
                ) : (
                  <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full min-w-[34rem] text-left text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="py-2 pr-4 font-normal">Started</th>
                          <th scope="col" className="pr-4 font-normal">Result</th>
                          <th scope="col" className="pr-4 text-right font-normal">Found</th>
                          <th scope="col" className="pr-4 text-right font-normal">New</th>
                          <th scope="col" className="font-normal">Started by</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule">
                        {s.runs.map((r) => (
                          <tr key={r.id} className="align-top">
                            <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(r.started_at)}</td>
                            <td className="py-2.5 pr-4">
                              <RunStatus status={r.status} />
                              {r.error && <span className="block text-xs text-danger">{r.error}</span>}
                              {r.details.warnings?.map((w) => (
                                <span key={w} className="block text-xs text-urgent">
                                  {w}
                                </span>
                              ))}
                            </td>
                            <td className="tabular py-2.5 pr-4 text-right">{r.items_found}</td>
                            <td className={cn("tabular py-2.5 pr-4 text-right", r.items_new === 0 && "text-muted-foreground")}>{r.items_new}</td>
                            <td className="py-2.5 text-muted-foreground">{r.trigger === "scheduled" ? "Schedule" : "You"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Source settings</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceForm existing={s} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function SourcePage({ params }: PageProps<"/sources/[id]">) {
  return (
    <PageFrame>
      <Suspense
        fallback={
          <div aria-label="Loading the source">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-6 h-8 w-1/2" />
            <Skeleton className="mt-6 h-20 rounded-lg" />
            <Skeleton className="mt-4 h-80 rounded-lg" />
          </div>
        }
      >
        <Loader params={params} />
      </Suspense>
    </PageFrame>
  );
}
