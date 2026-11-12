"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";

import { openPalette } from "./command-palette";

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Sidebar entry to the command palette, with the shortcut for this platform. */
export function SearchButton() {
  const mac = useSyncExternalStore(noop, isMac, () => false);
  return (
    <button
      type="button"
      onClick={openPalette}
      className="flex h-9 w-full items-center gap-2.5 rounded-md border border-control bg-surface px-2.5 text-sm text-muted-foreground transition-colors duration-[var(--dur-1)] hover:border-faint hover:text-foreground glass:border-glass-edge glass:bg-surface/60"
    >
      <Search className="size-4" aria-hidden />
      <span className="flex-1 text-left">Search</span>
      <kbd className="font-sans text-xs text-faint" aria-label={mac ? "Command K" : "Control K"}>
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
