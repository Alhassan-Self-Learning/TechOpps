"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A small menu anchored to its trigger. Closes on Escape (focus returns to the trigger),
 * on a click outside, and when an item inside asks it to via `close`.
 */
export function Popover({
  trigger,
  label,
  placement = "top-start",
  className,
  children,
}: {
  trigger: (props: {
    id: string;
    "aria-expanded": boolean;
    "aria-controls": string;
    "aria-haspopup": "dialog";
    onClick: () => void;
    ref: React.Ref<HTMLButtonElement>;
  }) => React.ReactNode;
  label: string;
  placement?: "top-start" | "bottom-end" | "bottom-start";
  className?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Focus returns to the trigger by id, so closing never reads a ref during render.
  const close = useCallback(() => {
    setOpen(false);
    document.getElementById(`${id}-trigger`)?.focus();
  }, [id]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("input:checked, button, a, input")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      {trigger({
        id: `${id}-trigger`,
        "aria-expanded": open,
        "aria-controls": id,
        "aria-haspopup": "dialog",
        onClick: () => setOpen((v) => !v),
        ref: triggerRef,
      })}
      {open && (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            "floating absolute z-50 min-w-56 rounded-xl p-1.5 animate-pop",
            placement === "top-start" && "bottom-full left-0 mb-2 origin-bottom-left",
            placement === "bottom-end" && "top-full right-0 mt-2 origin-top-right",
            placement === "bottom-start" && "top-full left-0 mt-2 origin-top-left",
            className,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
