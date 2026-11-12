import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AppearancePicker } from "@/components/appearance/appearance-picker";
import type { SystemStatusResponse } from "@/components/dashboard/system-status";
import { PageFrame, PageHeader } from "@/components/page-header";
import { SignOut } from "@/components/sign-out";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiGet, type AIUsage, type DashboardResponse, type HealthResponse } from "@/lib/api";
import { authEnabled } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

/** One settings area: what it is on the left, its controls or current values on the right. */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-20 gap-x-10 gap-y-4 border-b border-border py-8 first:pt-2 last:border-b-0 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div>
        <h2 id={`${id}-title`} className="text-base font-semibold">
          {title}
        </h2>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="min-w-0 rounded-lg border bg-surface p-5">{children}</div>
    </section>
  );
}

function Row({ term, children, note }: { term: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[12rem_minmax(0,1fr)]">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="text-sm">
        {children}
        {note && <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function On({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return <Badge tone={on ? "ok" : "neutral"}>{on ? yes : no}</Badge>;
}

async function Account() {
  await connection(); // the environment is read per request, never baked into the build
  const auth = authEnabled();
  return (
    <dl className="divide-y divide-rule">
      <Row
        term="Sign-in"
        note={
          auth
            ? "Sessions last 30 days on this device."
            : "Set APP_PASSWORD on the server to require a password, for example on a hosted deployment."
        }
      >
        <On on={auth} yes="Password required" no="Off (single user, this computer)" />
      </Row>
      {auth && (
        <div className="pt-3">
          <div className="max-w-44">
            <SignOut />
          </div>
        </div>
      )}
    </dl>
  );
}

async function ServerSettings() {
  await connection();
  const [system, health, usage, dashboard] = await Promise.all([
    apiGet<SystemStatusResponse>("/api/v1/system/status").catch(() => null),
    api.health().catch(() => null as HealthResponse | null),
    api.aiUsage().catch(() => null as AIUsage | null),
    api.dashboard().catch(() => null as DashboardResponse | null),
  ]);
  const unreachable = <p className="text-sm text-muted-foreground">The API could not be reached, so current values are unknown.</p>;

  return (
    <>
      <Section
        id="collection"
        title="Collection and AI"
        description={
          <>
            How sources are checked and processed. These are set in the server&apos;s <code className="text-[0.8125rem]">.env</code> file and shown here as they are now.
          </>
        }
      >
        {!system && !health ? (
          unreachable
        ) : (
          <dl className="divide-y divide-rule">
            {system && (
              <Row
                term="Scheduler"
                note={system.scheduler.tick_seconds ? `Looks for due sources every ${system.scheduler.tick_seconds} seconds.` : undefined}
              >
                <On on={system.scheduler.enabled && system.scheduler.running} yes="Running" no={system.scheduler.enabled ? "Not running" : "Turned off"} />
              </Row>
            )}
            {system && (
              <Row term="Automatic AI processing" note="Collected items are processed about once a minute when this is on.">
                <On on={system.auto_process_with_ai} yes="On" no="Off: process from Review" />
              </Row>
            )}
            <Row term="AI provider" note={health && !health.ai_configured ? "Add GEMINI_API_KEY to enable extraction." : undefined}>
              {usage?.configured ? `${usage.provider}, ${usage.model}` : health?.ai_configured ? "Configured" : "No API key set"}
            </Row>
            {system && (
              <Row term="Sources" note="New sources always start inactive; sources that keep failing are paused automatically.">
                <span className="tabular">{system.active_sources} active</span>
                {system.failing_sources.length > 0 && (
                  <span className="font-medium text-danger"> · {system.failing_sources.length} failing</span>
                )}
              </Row>
            )}
            <Row term="Manage">
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/sources" className="font-medium underline-offset-4 hover:underline">
                  Sources
                </Link>
                <Link href="/review" className="font-medium underline-offset-4 hover:underline">
                  Review and AI controls
                </Link>
              </span>
            </Row>
          </dl>
        )}
      </Section>

      <Section
        id="reminders"
        title="Reminders"
        description="When TechOpps reminds you. The schedule is fixed by the server."
      >
        <dl className="divide-y divide-rule">
          <Row term="Deadline reminders">7, 3 and 1 day before each deadline of an opportunity you saved, and before your own target dates.</Row>
          <Row term="Source problems">A notice when a source keeps failing.</Row>
          <Row term="Where">
            <Link href="/notifications" className="font-medium underline-offset-4 hover:underline">
              Reminders
            </Link>
            <span className="text-muted-foreground">, with a count in the sidebar while any are unread.</span>
          </Row>
        </dl>
      </Section>

      <Section id="data" title="Sample data" description="Fictional records for trying the interface. Each one is labelled Sample and links only to example.org.">
        {!dashboard ? (
          unreachable
        ) : dashboard.mock_count === 0 ? (
          <p className="text-sm">No sample data is loaded.</p>
        ) : (
          <div className="grid gap-3 text-sm">
            <p>
              <span className="tabular font-medium">{dashboard.mock_count}</span> sample records are loaded. Remove them from a terminal in the
              project folder:
            </p>
            <pre className="overflow-x-auto rounded-md bg-surface-2 px-3 py-2.5 text-[0.8125rem]">
              <code>{`# Windows, without Docker\n.\\scripts\\windows\\run-cli.ps1 clear-mock\n\n# Docker\ndocker compose exec api python -m app.cli clear-mock`}</code>
            </pre>
          </div>
        )}
      </Section>
    </>
  );
}

export default function SettingsPage() {
  return (
    <PageFrame className="max-w-[64rem]">
      <PageHeader title="Settings" description="Appearance is saved in this browser. Everything else reflects how the server is configured." />
      <div>
        <Section
          id="appearance"
          title="Appearance"
          description="Light, Dark or Liquid Glass. Until you choose, TechOpps follows your device's setting."
        >
          <AppearancePicker />
        </Section>

        <Section id="account" title="Account" description="TechOpps is a private, single-user workspace.">
          <Suspense fallback={<Skeleton className="h-10" />}>
            <Account />
          </Suspense>
        </Section>

        <Suspense
          fallback={
            <div className="grid gap-4 py-8">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          }
        >
          <ServerSettings />
        </Suspense>
      </div>
    </PageFrame>
  );
}
