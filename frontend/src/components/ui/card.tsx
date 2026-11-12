import * as React from "react";

import { cn } from "@/lib/utils";

/** A white sheet with a 1px edge and no shadow. Content panels stay opaque in every appearance. */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("min-w-0 rounded-lg border bg-surface", className)} {...props} />;
}

/** Title row of a panel: the title on the left, a period, count or "View all" on the right. */
export function CardHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={cn("flex min-h-12 items-center justify-between gap-4 px-5 pt-3.5 pb-1", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-[0.9375rem] font-semibold", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pt-2 pb-5", className)} {...props} />;
}

/** The muted right-hand note in a card header (a count, a period). */
export function CardMeta({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("tabular text-sm text-muted-foreground", className)} {...props} />;
}
