"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Unread reminder count for the navigation. Polls every minute; refreshes on demand. */
export function UnreadBadge({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/v1/notifications/count", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { unread: 0 }))
        .then((d: { unread: number }) => alive && setCount(d.unread))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener("techopps:notifications", load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("techopps:notifications", load);
    };
  }, []);
  if (!count) return null;
  return (
    <span
      className={cn(
        "tabular inline-grid h-5 min-w-5 place-items-center rounded-full bg-urgent-soft px-1.5 text-xs font-semibold text-urgent",
        className,
      )}
    >
      {count}
      <span className="sr-only"> unread</span>
    </span>
  );
}
