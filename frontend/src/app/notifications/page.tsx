import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Bell, Radio } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorNote } from "@/components/error-note";
import { MarkRead } from "@/components/notifications/mark-read";
import { PageFrame, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiGet } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reminders" };

type NotificationOut = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  opportunity_id: string | null;
  source_id: string | null;
  due_at: string | null;
  created_at: string;
  read_at: string | null;
};

async function List() {
  await connection();
  let items: NotificationOut[];
  try {
    items = await apiGet<NotificationOut[]>("/api/v1/notifications");
  } catch (e) {
    return <ErrorNote title="Could not load reminders" message={e instanceof ApiError ? e.message : "Unknown error."} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No reminders yet"
        body="Save an opportunity or set your own target date. You get a reminder 7, 3 and 1 day before each deadline."
        action={{ href: "/opportunities", label: "Discover opportunities" }}
      />
    );
  }
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="tabular text-sm text-muted-foreground" aria-live="polite">
          {unread ? `${unread} unread of ${items.length}` : `All ${items.length} read`}
        </p>
        {unread > 0 && <MarkRead />}
      </div>
      <ul className="divide-y divide-rule overflow-hidden rounded-lg border bg-surface">
        {items.map((n) => {
          const href = n.opportunity_id ? `/opportunities/${n.opportunity_id}` : n.source_id ? `/sources/${n.source_id}` : null;
          const Icon = n.source_id && !n.opportunity_id ? Radio : Bell;
          return (
            <li key={n.id} className={cn("relative flex items-start gap-3 px-5 py-4", !n.read_at && "bg-surface-2/40")}>
              <span className="relative mt-0.5 shrink-0">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {!n.read_at && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-urgent-mark ring-2 ring-surface" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                  {!n.read_at && <span className="sr-only">Unread: </span>}
                  {href ? (
                    <Link href={href} className="underline-offset-4 hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    n.title
                  )}
                </p>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="tabular mt-1 text-xs text-muted-foreground">
                  <time dateTime={n.created_at} title={formatDate(n.created_at)}>
                    {timeAgo(n.created_at)}
                  </time>
                  {n.due_at && <> · due {formatDate(n.due_at)}</>}
                </p>
              </div>
              {!n.read_at && <MarkRead id={n.id} />}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <PageFrame className="max-w-[48rem]">
      <PageHeader title="Reminders" description="Deadline reminders for what you saved, and notices about sources that stopped working." />
      <Suspense
        fallback={
          <div aria-label="Loading reminders">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <List />
      </Suspense>
    </PageFrame>
  );
}
