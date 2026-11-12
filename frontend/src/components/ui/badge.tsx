import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Pale tint with dark text of the same hue. Never squeezed: chips keep their width. */
const pill = cva(
  "inline-flex h-5 flex-none items-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-foreground",
        signal: "bg-signal-soft text-signal",
        urgent: "bg-urgent-soft text-urgent",
        ok: "bg-ok-soft text-ok",
        danger: "bg-danger-soft text-danger",
        outline: "border border-dashed border-control text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof pill>) {
  return <span className={cn(pill({ tone }), className)} {...props} />;
}
