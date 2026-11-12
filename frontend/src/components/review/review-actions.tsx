"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/api";

export function ApproveButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await apiRequest(`/api/v1/review/opportunities/${id}/approve`, { method: "POST" });
            router.refresh();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Could not approve.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Details are correct
      </Button>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function DuplicateActions({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function decide(body: { action: "merge" | "not_duplicate"; keep?: "a" | "b" }) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/review/duplicates/${id}`, { method: "POST", body });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => decide({ action: "merge", keep: "a" })}>
          Same opportunity: keep left
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => decide({ action: "merge", keep: "b" })}>
          Same opportunity: keep right
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => decide({ action: "not_duplicate" })}>
          Different opportunities
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Merging hides the other record and moves its sources and your tracking to the one you keep.
      </p>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
