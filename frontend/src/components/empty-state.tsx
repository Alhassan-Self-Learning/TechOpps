import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** An empty block keeps its frame: one sentence of what is missing, and the next step. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-control px-5 py-7", className)}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{body}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
