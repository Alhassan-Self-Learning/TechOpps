import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { PageFrame, PageHeader } from "@/components/page-header";
import { AIControls } from "@/components/review/ai-controls";
import { ApproveButton, DuplicateActions } from "@/components/review/review-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  ApiError,
  type AIUsage,
  type DuplicatePair,
  type OpportunityDetail,
  type OpportunityListItem,
  type Page,
} from "@/lib/api";
import { DATE_FIELD_LABELS, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Review" };

function Side({ o, which }: { o: OpportunityListItem; which: string }) {
  const dates = (["registration_deadline", "application_deadline", "starts_at"] as const).filter((f) => o[f]);
  return (
    <div className="min-w-0 rounded-lg border bg-surface p-3.5 text-sm">
      <p className="mb-1.5 text-xs text-muted-foreground">{which}</p>
      <CategoryBadge category={o.category} subtype={o.subtype} />
      <p className="mt-1 font-semibold">
        <Link href={`/opportunities/${o.id}`} className="underline-offset-4 hover:underline">
          {o.title}
        </Link>
      </p>
      <p className="text-muted-foreground">{o.organizer ?? "Organizer not stated"}</p>
      <dl className="mt-2 grid gap-0.5 text-xs">
        {dates.map((f) => (
          <div key={f} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{DATE_FIELD_LABELS[f]}</dt>
            <dd>{formatDate(o[f], o.date_precision[f] ?? "datetime", o.timezone)}</dd>
          </div>
        ))}
      </dl>
      {o.url && <p className="mt-1.5 truncate text-xs text-muted-foreground">{o.url}</p>}
    </div>
  );
}

async function ReviewContent() {
  let flagged: Page<OpportunityListItem>;
  let pairs: DuplicatePair[];
  let usage: AIUsage;
  try {
    [flagged, pairs, usage] = await Promise.all([
      api.opportunities("?needs_review=true&include_past=true&page_size=50&sort=newest"),
      api.duplicates(),
      api.aiUsage(),
    ]);
  } catch (e) {
    return <ErrorNote title="Could not load the review queue" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  const details = await Promise.all(flagged.items.slice(0, 20).map((i) => api.opportunity(i.id).catch(() => null)));
  const reasons = new Map(details.filter((d): d is OpportunityDetail => d !== null).map((d) => [d.id, d.review_reasons]));
  const t = usage.totals;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="grid min-w-0 content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Uncertain details</CardTitle>
            <CardMeta>{flagged.total}</CardMeta>
          </CardHeader>
          <CardContent className="pt-0">
            {flagged.total === 0 ? (
              <EmptyState title="Nothing to review" body="Opportunities appear here when the AI was unsure or a value had no supporting text in the source." />
            ) : (
              <ul className="divide-y divide-rule">
                {flagged.items.map((o) => (
                  <li key={o.id} className="py-4 first:pt-2">
                    <CategoryBadge category={o.category} subtype={o.subtype} />
                    <p className="mt-1 font-semibold">
                      <Link href={`/opportunities/${o.id}`} className="underline-offset-4 hover:underline">
                        {o.title}
                      </Link>
                    </p>
                    {(reasons.get(o.id) ?? []).length > 0 && (
                      <ul className="mt-1.5 list-disc pl-5 text-sm text-muted-foreground marker:text-faint">
                        {(reasons.get(o.id) ?? []).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap items-start gap-2">
                      <ApproveButton id={o.id} />
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/opportunities/${o.id}#correct`}>Correct details</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Possible duplicates</CardTitle>
            <CardMeta>{pairs.length}</CardMeta>
          </CardHeader>
          <CardContent className="pt-0">
            {pairs.length === 0 ? (
              <EmptyState
                title="No possible duplicates"
                body="When two records look like the same opportunity, they appear here side by side. Nothing is merged without your decision."
              />
            ) : (
              <ul className="grid gap-6">
                {pairs.map((p) => (
                  <li key={p.id}>
                    <p className="mb-2 text-sm">
                      <span className="tabular font-medium">{Math.round(p.score * 100)}% match</span>
                      <span className="text-muted-foreground">: {p.reasons.join(", ")}</span>
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Side o={p.a} which="Left" />
                      <Side o={p.b} which="Right" />
                    </div>
                    <div className="mt-3">
                      <DuplicateActions id={p.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>AI processing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Provider</dt>
            <dd className="text-right">{usage.configured ? `${usage.provider}, ${usage.model}` : "Not configured"}</dd>
            <dt className="text-muted-foreground">Waiting items</dt>
            <dd className="tabular text-right">{usage.pending_items}</dd>
            <dt className="text-muted-foreground">Failed items</dt>
            <dd className="tabular text-right">{usage.failed_items}</dd>
            <dt className="text-muted-foreground">AI calls</dt>
            <dd className="tabular text-right">
              {t.calls.toLocaleString("en-GB")} <span className="text-muted-foreground">({t.failed} failed)</span>
            </dd>
            <dt className="text-muted-foreground">Tokens in / out</dt>
            <dd className="tabular text-right">
              {t.input_tokens.toLocaleString("en-GB")} / {t.output_tokens.toLocaleString("en-GB")}
            </dd>
            <dt className="text-muted-foreground">Cost</dt>
            <dd className="tabular text-right">
              {t.cost_usd !== null ? `$${Number(t.cost_usd).toFixed(4)}${t.cost_complete ? "" : "+"}` : "Unknown"}
            </dd>
          </dl>
          {!usage.pricing_configured && (
            <p className="text-xs text-muted-foreground">
              Cost is shown once you set AI_INPUT_COST_PER_MTOK and AI_OUTPUT_COST_PER_MTOK in .env, using your plan&apos;s current prices.
            </p>
          )}
          <div className="border-t border-rule pt-4">
            <AIControls pending={usage.pending_items} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Review"
        description="What the AI was unsure about, and records that may be the same opportunity. Your corrections are kept as yours."
      />
      <Suspense
        fallback={
          <div aria-label="Loading the review queue" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        }
      >
        <ReviewContent />
      </Suspense>
    </PageFrame>
  );
}
