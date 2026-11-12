"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/field";
import { ApiError, type TrackingStatus } from "@/lib/api";
import { label } from "@/lib/format";
import { updateTracking } from "@/lib/mutations";
import { TRACKING_STATUSES } from "@/lib/tracking";
import { cn } from "@/lib/utils";


/**
 * Change where an application stands without opening it. Same rules as the detail page:
 * setting a status keeps the opportunity in Saved.
 */
export function StatusSelect({
  id,
  initial,
  title,
  className,
}: {
  id: string;
  initial: TrackingStatus | null;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<TrackingStatus | "">(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function change(next: TrackingStatus | "") {
    const before = value;
    setValue(next);
    setError(null);
    try {
      await updateTracking(id, { tracking_status: next || null });
      startTransition(() => router.refresh());
    } catch (e) {
      setValue(before);
      setError(e instanceof ApiError ? e.message : "Could not update.");
    }
  }

  return (
    <div className={cn("relative z-10 min-w-0", className)}>
      <Select
        aria-label={`Status for ${title}`}
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as TrackingStatus | "")}
        className={cn("h-8 pr-7 pl-2.5 text-[0.8125rem]", !value && "text-muted-foreground")}
      >
        <option value="">Not tracking</option>
        {TRACKING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </Select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
