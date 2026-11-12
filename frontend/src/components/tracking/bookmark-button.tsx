"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { updateTracking } from "@/lib/mutations";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  id,
  initial,
  compact = false,
  title,
}: {
  id: string;
  initial: boolean;
  compact?: boolean;
  /** The opportunity's title, so the icon-only button has a specific accessible name. */
  title?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    const next = !saved;
    setSaved(next); // optimistic
    setError(null);
    try {
      await updateTracking(id, { is_bookmarked: next });
      startTransition(() => router.refresh());
    } catch (e) {
      setSaved(!next);
      setError(e instanceof ApiError ? e.message : "Could not save.");
    }
  }

  const name = saved ? "Remove from saved" : "Save";
  return (
    <div className="relative z-10 flex flex-col items-end">
      <Button
        type="button"
        variant={compact ? "ghost" : saved ? "secondary" : "outline"}
        size={compact ? "icon" : "default"}
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={compact ? `${name}${title ? `: ${title}` : ""}` : undefined}
        title={compact ? name : undefined}
        className={cn(compact && "text-muted-foreground hover:text-foreground", compact && saved && "text-foreground")}
      >
        <Bookmark
          className={cn("transition-transform duration-[var(--dur-2)]", saved && "scale-110 fill-current")}
          aria-hidden
        />
        {!compact && (saved ? "Saved" : "Save")}
      </Button>
      {error && (
        <p role="alert" className="mt-1 max-w-48 text-right text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
