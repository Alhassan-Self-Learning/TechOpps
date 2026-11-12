import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, TriangleAlert } from "lucide-react";

import { ErrorNote } from "@/components/error-note";
import { CategoryBadge, ReviewBadge, SampleBadge } from "@/components/opportunities/category-badge";
import { KeyDates } from "@/components/opportunities/key-dates";
import { StatusPill } from "@/components/opportunities/status-pill";
import { PageFrame } from "@/components/page-header";
import { CorrectForm } from "@/components/review/correct-form";
import { OpenOnHash } from "@/components/review/open-on-hash";
import { ApproveButton } from "@/components/review/review-actions";
import { BookmarkButton } from "@/components/tracking/bookmark-button";
import { TrackingPanel } from "@/components/tracking/tracking-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type OpportunityDetail, type TaxonomyResponse } from "@/lib/api";
import { detailRows } from "@/lib/details";
import { DEADLINE_VERB, daysUntil, formatDate, label, relativeDays, safeHref, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Opportunity" };

const notStated = <span className="text-muted-foreground">Not stated</span>;

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** One cell of the facts strip under the title. */
function Cell({ term, children, className }: { term: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-surface px-4 py-3", className)}>
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
      {note}
    </section>
  );
}

function Detail({ o, taxonomy }: { o: OpportunityDetail; taxonomy: TaxonomyResponse }) {
  const href = safeHref(o.url);
  const aiSummary = o.field_provenance?.summary?.origin === "ai";
  const cost =
    o.cost_amount && o.cost_currency ? `${label(o.cost_type)}, ${o.cost_amount} ${o.cost_currency}` : label(o.cost_type);
  const place = [o.delivery_mode && label(o.delivery_mode), o.delivery_mode !== "online" && (o.location_text || o.city)]
    .filter(Boolean)
    .join(", ");
  const nd = o.next_deadline;
  const details = Object.keys(o.category_details).length > 0 ? detailRows(o.category_details) : [];

  return (
    <article>
      <Link
        href="/opportunities"
        className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Discover
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={o.category} subtype={o.subtype} className="text-[0.8125rem]" />
            <StatusPill status={o.registration_status} />
            {o.is_mock && <SampleBadge />}
            {o.needs_review && <ReviewBadge />}
          </div>
          <h1 className="mt-2 text-[1.375rem] leading-tight font-semibold tracking-[-0.01em] text-balance md:text-[1.75rem]">{o.title}</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{o.organizer ?? "Organizer not stated"}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {href && (
            <Button asChild>
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                Open original listing <ExternalLink aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          )}
          <BookmarkButton id={o.id} initial={o.user.is_bookmarked} title={o.title} />
        </div>
      </header>

      {o.is_mock && (
        <p className="mt-3 text-sm text-muted-foreground">Fictional sample data for testing the interface. Not a real opportunity.</p>
      )}

      {/* The answer first: by when, when it runs, where, what it costs, for whom. */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-rule sm:grid-cols-3 lg:grid-cols-5">
        <Cell term={nd ? DEADLINE_VERB[nd.field] : "Next deadline"} className="col-span-2 sm:col-span-1">
          {nd ? (
            <>
              <span>{shortDate(nd.at, o.date_precision[nd.field] ?? "datetime", o.timezone)}</span>
              <span className={cn("tabular block text-xs font-normal", daysUntil(nd.at) <= 7 ? "font-medium text-urgent" : "text-muted-foreground")}>
                {relativeDays(nd.at)}
              </span>
            </>
          ) : (
            <span className="font-normal text-muted-foreground">None ahead</span>
          )}
        </Cell>
        <Cell term="Starts">
          {o.starts_at ? <span>{shortDate(o.starts_at, o.date_precision.starts_at ?? "datetime", o.timezone)}</span> : <span className="font-normal">{notStated}</span>}
        </Cell>
        <Cell term="Format">{place || <span className="font-normal">{notStated}</span>}</Cell>
        <Cell term="Cost">{o.cost_type ? cost : <span className="font-normal">{notStated}</span>}</Cell>
        <Cell term="Level" className="sm:col-span-2 lg:col-span-1">
          {o.skill_level ? label(o.skill_level) : <span className="font-normal">{notStated}</span>}
        </Cell>
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <div className="grid min-w-0 content-start gap-8">
          {o.needs_review && o.review_reasons.length > 0 && (
            <div className="rounded-lg border border-urgent/30 bg-urgent-soft px-4 py-3.5 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <TriangleAlert className="size-4 text-urgent" aria-hidden />
                Check these details against the original listing
              </p>
              <ul className="mt-1.5 list-disc pl-10 text-foreground/80">
                {o.review_reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-start gap-2 pl-6">
                <ApproveButton id={o.id} />
                <Button asChild variant="ghost" size="sm">
                  <a href="#correct">Correct details</a>
                </Button>
              </div>
            </div>
          )}

          {o.summary && (
            <Section
              title="Summary"
              note={aiSummary && <p className="mt-1.5 text-xs text-muted-foreground">Written by AI from the source text. The original listing is authoritative.</p>}
            >
              <p className="max-w-prose text-[0.9375rem] leading-relaxed">{o.summary}</p>
            </Section>
          )}

          <Section title="Eligibility">
            {o.eligibility ? (
              <p className="max-w-prose text-[0.9375rem] leading-relaxed whitespace-pre-line">{o.eligibility}</p>
            ) : (
              <p className="text-sm text-muted-foreground">The source does not say who can apply. Check the original listing.</p>
            )}
          </Section>

          {details.length > 0 && (
            <Section title="Details">
              <dl className="max-w-prose divide-y divide-rule border-y border-rule">
                {details.map((r) => (
                  <Fact key={r.term} term={r.term}>
                    {r.value}
                  </Fact>
                ))}
              </dl>
            </Section>
          )}

          {o.description && (
            <Section title="Description">
              {/* Plain text only: collected HTML is never rendered. */}
              <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line">{o.description}</p>
            </Section>
          )}

          <Section title="Where this came from">
            {o.sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {o.is_mock ? "Generated sample record, no source." : "Entered without a linked source."}
              </p>
            ) : (
              <ul className="divide-y divide-rule rounded-lg border bg-surface">
                {o.sources.map((s) => {
                  const raw = safeHref(s.raw_url);
                  return (
                    <li key={s.raw_item_id} className="px-4 py-3 text-sm">
                      <p>
                        <Link href={`/sources/${s.source_id}`} className="font-medium underline-offset-4 hover:underline">
                          {s.source_name}
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          {label(s.source_kind)}
                          {!s.is_primary && ", also seen here"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Collected {formatDate(s.collected_at)}
                        {s.ai_model && `, extracted by ${s.ai_model} (prompt ${s.ai_prompt_version})`}
                      </p>
                      {raw && (
                        <a href={raw} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 block truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                          {raw}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <OpenOnHash id="correct" />
          <details id="correct" className="group scroll-mt-6 rounded-lg border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-5 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
              <span>
                Correct details
                <span className="block text-sm font-normal text-muted-foreground">Your corrections are marked as yours and never overwritten.</span>
              </span>
              <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--dur-2)] group-open:rotate-180">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="border-t border-rule px-5 pt-4 pb-5">
              <CorrectForm o={o} taxonomy={taxonomy} />
            </div>
          </details>
        </div>

        <aside className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Key dates</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyDates o={o} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <TrackingPanel id={o.id} initial={o.user} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>More facts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="divide-y divide-rule">
                <Fact term="Duration">{o.duration_text || notStated}</Fact>
                <Fact term="Language">{o.language || notStated}</Fact>
                {o.funding_details && <Fact term="Funding">{o.funding_details}</Fact>}
                <Fact term="Fields">
                  {o.tech_fields.length ? (
                    <span className="flex flex-wrap gap-1">
                      {o.tech_fields.map((f) => (
                        <Badge key={f.value} className="font-normal">{f.label}</Badge>
                      ))}
                    </span>
                  ) : (
                    notStated
                  )}
                </Fact>
                {o.tags.length > 0 && <Fact term="Tags">{o.tags.map((t) => t.label).join(", ")}</Fact>}
                {o.extraction_confidence !== null && (
                  <Fact term="AI confidence">
                    <span className="tabular">{Math.round(o.extraction_confidence * 100)}%</span>
                  </Fact>
                )}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </article>
  );
}

async function DetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let o: OpportunityDetail;
  let taxonomy: TaxonomyResponse;
  try {
    [o, taxonomy] = await Promise.all([api.opportunity(id), api.taxonomy()]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return <ErrorNote title="Could not load this opportunity" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  return <Detail o={o} taxonomy={taxonomy} />;
}

function DetailSkeleton() {
  return (
    <div aria-label="Loading the opportunity">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-6 h-3 w-48" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-56" />
      <Skeleton className="mt-6 h-[4.5rem] rounded-lg" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

export default function OpportunityPage({ params }: PageProps<"/opportunities/[id]">) {
  return (
    <PageFrame>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailLoader params={params} />
      </Suspense>
    </PageFrame>
  );
}
