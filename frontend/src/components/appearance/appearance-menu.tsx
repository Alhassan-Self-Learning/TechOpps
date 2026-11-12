"use client";

import Link from "next/link";
import { Check, Settings } from "lucide-react";

import { Popover } from "@/components/ui/popover";
import { saveAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

import { APPEARANCE_OPTIONS, useAppearance } from "./appearance-picker";

/** Compact list of the four appearances, for menus. */
export function AppearanceList({ onPicked }: { onPicked?: () => void }) {
  const { appearance } = useAppearance();
  return (
    <fieldset>
      <legend className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Appearance</legend>
      {APPEARANCE_OPTIONS.map((o) => {
        const checked = appearance === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm transition-colors duration-[var(--dur-1)] hover:bg-surface-2",
              "has-[:focus-visible]:bg-surface-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
            )}
          >
            <input
              type="radio"
              name="appearance-menu"
              value={o.value}
              checked={checked}
              onChange={() => {
                saveAppearance({ appearance: o.value });
                onPicked?.();
              }}
              className="sr-only"
            />
            <o.icon className="size-4 text-muted-foreground" aria-hidden />
            <span className="flex-1">{o.label}</span>
            {checked && <Check className="size-4" aria-hidden />}
          </label>
        );
      })}
    </fieldset>
  );
}

/** Sidebar footer button: the current appearance's icon, opening the list above it. */
export function AppearanceMenu() {
  const { appearance } = useAppearance();
  const current = APPEARANCE_OPTIONS.find((o) => o.value === appearance) ?? APPEARANCE_OPTIONS[0];
  return (
    <Popover
      label="Appearance"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground aria-expanded:bg-surface-2 aria-expanded:text-foreground"
        >
          <current.icon className="size-4" aria-hidden />
          <span className="flex-1 text-left">Appearance</span>
          <span className="text-xs text-faint">{current.value === "glass" ? "Glass" : current.label}</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <AppearanceList onPicked={close} />
          <div className="my-1 h-px bg-rule" />
          <Link
            href="/settings#appearance"
            onClick={close}
            className="flex h-9 items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-surface-2"
          >
            <Settings className="size-4 text-muted-foreground" aria-hidden />
            All settings
          </Link>
        </>
      )}
    </Popover>
  );
}
