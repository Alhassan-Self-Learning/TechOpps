import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared look for text inputs, selects and textareas: white, 1px control border, 36px tall. */
export const controlClass =
  "block w-full min-w-0 rounded-md border border-control bg-surface px-3 text-sm transition-[border-color,box-shadow] duration-[var(--dur-1)] hover:border-faint focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-60";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium", className)} {...props} />;
}

export function Hint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-1.5 text-xs text-muted-foreground", className)} {...props} />;
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "py-2 leading-relaxed", className)} {...props} />;
}

/** Native select (keyboard and screen-reader behaviour for free) with a drawn chevron. */
export function Select({ className, wrapperClassName, ...props }: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <select className={cn(controlClass, "h-9 cursor-pointer appearance-none pr-8", className)} {...props} />
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** One label + control + optional hint, stacked. */
export function Field({
  id,
  label,
  hint,
  optional,
  children,
  className,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      {children}
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
    </div>
  );
}

/** Result line under a form or action: what happened, in words. */
export function FormMessage({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={cn("text-sm", message.ok ? "text-ok" : "text-danger")}>
      {message.text}
    </p>
  );
}
