"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A modal panel built on <dialog>: focus is trapped and Escape closes it for free.
 * `side="right"` is a drawer (forms), `side="bottom"` a phone sheet (filters, menus),
 * `side="center"` a dialog. A floating surface: translucent in Liquid Glass.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "bottom" | "center";
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
      className={cn(
        "floating fixed m-0 max-h-none flex-col overflow-hidden p-0 text-foreground open:flex",
        side === "right" &&
          "inset-y-2 right-2 left-auto h-[calc(100dvh-1rem)] w-[min(28rem,calc(100vw-1rem))] rounded-xl animate-sheet-left",
        side === "bottom" &&
          "inset-x-0 top-auto bottom-0 max-h-[88dvh] w-full max-w-none rounded-t-2xl rounded-b-none border-b-0 animate-sheet-up",
        side === "center" &&
          "inset-0 m-auto h-fit max-h-[80dvh] w-[min(34rem,calc(100vw-2rem))] rounded-xl animate-pop",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      {footer && <div className="border-t border-rule px-5 py-3">{footer}</div>}
    </dialog>
  );
}
