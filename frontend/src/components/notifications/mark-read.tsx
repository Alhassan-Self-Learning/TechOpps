"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/api";

export function MarkRead({ id }: { id?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <Button
        size="sm"
        variant={id ? "ghost" : "outline"}
        className={id ? "relative z-10 text-muted-foreground hover:text-foreground" : undefined}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await apiRequest(id ? `/api/v1/notifications/${id}/read` : "/api/v1/notifications/read-all", {
              method: "POST",
            });
            window.dispatchEvent(new Event("techopps:notifications"));
            router.refresh();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Could not update.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {id ? "Mark as read" : "Mark all as read"}
      </Button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}
