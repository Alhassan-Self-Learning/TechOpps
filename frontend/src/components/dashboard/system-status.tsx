import Link from "next/link";

import { RunStatus } from "@/components/sources/run-status";
import type { HealthResponse, SourceOut } from "@/lib/api";
import { label, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SystemStatusResponse = {
  scheduler: { enabled: boolean; running: boolean; tick_seconds?: number; last_tick_at: string | null };
  active_sources: number;
  failing_sources: { id: string; name: string; consecutive_failures?: number; last_error?: string | null }[];
  pending_items: number;
  auto_process_with_ai: boolean;
};

function Dot({ ok }: { ok: boolean }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", ok ? "bg-ok" : "bg-danger")} />;
}

/**
 * Collection health: is the scheduler running, which sources ran and how, what waits for the AI.
 * Every line is read from the API; missing parts say so instead of guessing.
 */
export function CollectionStatus({
  health,
  system,
  sources,
}: {
  health: HealthResponse | null;
  system: SystemStatusResponse | null;
  sources: SourceOut[] | null;
}) {
  if (!health) {
    return (
      <div className="text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Dot ok={false} /> The API could not be reached
        </p>
        <p className="mt-1 text-muted-foreground">
          A hosted backend sleeps when idle and can take about a minute to wake. Reload shortly.
        </p>
      </div>
    );
  }

  const active = (sources ?? []).filter((s) => s.is_active);
  const failing = new Set(system?.failing_sources.map((f) => f.id) ?? []);
  const shown = [...active].sort((a, b) => Number(failing.has(b.id)) - Number(failing.has(a.id))).slice(0, 4);

  return (
    <div className="flex h-full flex-col gap-4">
      {system && (
        <dl className="grid gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2">
              <Dot ok={system.scheduler.running} /> Scheduler
            </dt>
            <dd className="text-muted-foreground" suppressHydrationWarning>
              {!system.scheduler.enabled
                ? "Turned off"
                : !system.scheduler.running
                  ? "Not running"
                  : system.scheduler.last_tick_at
                    ? `Checked ${timeAgo(system.scheduler.last_tick_at)}`
                    : "Starting"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2">
              <Dot ok={health.ai_configured} /> AI extraction
            </dt>
            <dd className="tabular text-muted-foreground">
              {!health.ai_configured
                ? "No API key set"
                : system.pending_items === 0
                  ? "Nothing waiting"
                  : `${system.pending_items} waiting${system.auto_process_with_ai ? "" : ", manual"}`}
            </dd>
          </div>
        </dl>
      )}

      <div>
        <p className="mb-1 text-xs text-muted-foreground">
          {active.length} active {active.length === 1 ? "source" : "sources"}
          {failing.size > 0 && <span className="font-medium text-danger"> · {failing.size} failing</span>}
        </p>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sources. Nothing is collected until you activate one.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {shown.map((s) => (
              <li key={s.id}>
                <Link href={`/sources/${s.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{label(s.kind)}</span>
                  </span>
                  <span className="text-right text-xs leading-tight">
                    <RunStatus status={s.last_run_status} />
                    <span className="block text-muted-foreground" suppressHydrationWarning>
                      {s.last_run_at ? timeAgo(s.last_run_at) : s.kind === "manual" ? "Pasted by you" : "Not run yet"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-auto border-t border-rule pt-3 text-sm text-muted-foreground">
        API {health.version} · database {health.database === "ok" ? "connected" : "unavailable"}
      </p>
    </div>
  );
}
