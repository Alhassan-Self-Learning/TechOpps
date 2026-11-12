"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { ApiError, apiRequest } from "@/lib/api";

type ProcessSummary = {
  processed: number;
  created: number;
  attached: number;
  skipped: number;
  failed: number;
  duplicates_flagged: number;
  stopped_reason: string | null;
};

export function AIControls({ pending }: { pending: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function testConnection() {
    setBusy("test");
    setMessage(null);
    try {
      const r = await apiRequest<{ ok: boolean; message: string; model?: string; latency_ms?: number }>(
        "/api/v1/ai/test",
        { method: "POST", timeoutMs: 90000 },
      );
      setMessage({
        ok: r.ok,
        text: r.ok ? `Connected to ${r.model} (${r.latency_ms} ms). ${r.message}` : r.message,
      });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Test failed." });
    } finally {
      setBusy(null);
    }
  }

  async function processNow() {
    setBusy("process");
    setMessage(null);
    try {
      const s = await apiRequest<ProcessSummary>("/api/v1/ai/process?limit=10", {
        method: "POST",
        timeoutMs: 600000,
      });
      const parts = [
        `${s.created} new`,
        s.attached ? `${s.attached} matched existing` : null,
        s.skipped ? `${s.skipped} not opportunities` : null,
        s.failed ? `${s.failed} failed` : null,
        s.duplicates_flagged ? `${s.duplicates_flagged} possible duplicates` : null,
      ].filter(Boolean);
      setMessage(
        s.stopped_reason
          ? { ok: false, text: `Stopped: ${s.stopped_reason}` }
          : { ok: true, text: `Processed ${s.processed}: ${parts.join(", ")}.` },
      );
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Processing failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={testConnection} disabled={!!busy}>
          {busy === "test" ? "Testing…" : "Test AI connection"}
        </Button>
        <Button size="sm" onClick={processNow} disabled={!!busy || pending === 0}>
          {busy === "process"
            ? "Processing…"
            : pending === 0
              ? "Nothing waiting"
              : `Process ${Math.min(pending, 10)} waiting ${Math.min(pending, 10) === 1 ? "item" : "items"} now`}
        </Button>
      </div>
      <div className="mt-2 empty:hidden">
        <FormMessage message={message} />
      </div>
    </div>
  );
}
