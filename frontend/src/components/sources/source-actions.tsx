"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { ApiError, apiRequest, type RunOut, type SourceOut } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Activate, deactivate, collect now and delete. Nothing here runs on its own: every action is a
 * press by the user, and a source never collects until it is active.
 */
export function SourceActions({
  source,
  showDelete = false,
  emphasis = false,
  className,
}: {
  source: SourceOut;
  showDelete?: boolean;
  /** On the source's own page, activation is the main job: fill that button. */
  emphasis?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function act(name: string, fn: () => Promise<string>) {
    setBusy(name);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await fn() });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  const base = `/api/v1/sources/${source.id}`;
  return (
    <div className={cn("relative z-10", className)}>
      <div className="flex flex-wrap gap-2">
        {source.is_active ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() =>
              act("deactivate", async () => {
                await apiRequest(`${base}/deactivate`, { method: "POST" });
                return "Deactivated. Nothing will be collected from it.";
              })
            }
          >
            <Pause aria-hidden /> Deactivate
          </Button>
        ) : (
          <Button
            size="sm"
            variant={emphasis ? "default" : "outline"}
            disabled={!!busy}
            onClick={() =>
              act("activate", async () => {
                await apiRequest(`${base}/activate`, { method: "POST" });
                return "Activated. It will be collected on its schedule.";
              })
            }
          >
            <Play aria-hidden /> Activate
          </Button>
        )}
        {source.is_active && source.kind !== "manual" && (
          <Button
            size="sm"
            variant={emphasis ? "default" : "outline"}
            disabled={!!busy}
            onClick={() =>
              act("collect", async () => {
                const run = await apiRequest<RunOut>(`${base}/collect`, { method: "POST", timeoutMs: 120000 });
                if (run.status === "failed") throw new ApiError(`Collection failed: ${run.error}`, null);
                return `Collected: ${run.items_found} found, ${run.items_new} new.`;
              })
            }
          >
            <RefreshCw aria-hidden className={busy === "collect" ? "animate-spin" : undefined} />
            {busy === "collect" ? "Collecting…" : "Collect now"}
          </Button>
        )}
        {showDelete && (
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Delete
          </Button>
        )}
      </div>
      <div aria-live="polite" className="mt-2 empty:hidden">
        <FormMessage message={message} />
      </div>

      {showDelete && (
        <Sheet
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          side="center"
          title={`Delete “${source.name}”?`}
          description="The source and the items collected from it are deleted. This cannot be undone."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                disabled={!!busy}
                onClick={() =>
                  act("delete", async () => {
                    await apiRequest(base, { method: "DELETE" });
                    setConfirmDelete(false);
                    router.push("/sources");
                    return "Deleted.";
                  })
                }
              >
                {busy === "delete" ? "Deleting…" : "Delete source and its items"}
              </Button>
            </div>
          }
        >
          <p className="text-sm">
            <span className="tabular font-medium">{source.raw_items.toLocaleString("en-GB")}</span>{" "}
            {source.raw_items === 1 ? "collected item" : "collected items"} will be deleted with it.
          </p>
        </Sheet>
      )}
    </div>
  );
}
