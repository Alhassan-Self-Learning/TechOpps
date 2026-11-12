"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";

import { APPEARANCE_OPTIONS } from "@/components/appearance/appearance-picker";
import { CategoryIcon } from "@/components/opportunities/category-badge";
import { apiGet, type OpportunityListItem, type Page } from "@/lib/api";
import { saveAppearance } from "@/lib/appearance";
import { CATEGORY_LABEL } from "@/lib/categories";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { NAV_ALL } from "./nav-config";

export const PALETTE_EVENT = "techopps:palette";

/** Opens the palette from anywhere (the sidebar search button, the phone top bar). */
export function openPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}

type Item = {
  id: string;
  group: "Opportunities" | "Search" | "Go to" | "Appearance";
  label: string;
  detail?: string;
  icon?: React.ReactNode;
  run: () => void;
};

/**
 * Ctrl/⌘ K: search opportunities by title or organizer, jump to any page, or switch appearance.
 * A combobox over a listbox; arrows move, Enter opens, Escape closes. Results come from the same
 * search the Discover page uses.
 */
export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpportunityListItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(0);
  const listId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  // Live search, debounced, with stale requests cancelled.
  const searching = query.trim().length >= 2;
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const t = window.setTimeout(() => {
      setState("loading");
      apiGet<Page<OpportunityListItem>>(
        `/api/v1/opportunities?q=${encodeURIComponent(q)}&page_size=6&include_past=true`,
      )
        .then((page) => {
          if (!controller.signal.aborted) {
            setResults(page.items);
            setState("idle");
          }
        })
        .catch(() => !controller.signal.aborted && setState("error"));
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Item[] = (searching ? results : []).map((o) => ({
      id: `o-${o.id}`,
      group: "Opportunities",
      label: o.title,
      detail: [CATEGORY_LABEL[o.category], o.organizer, o.next_deadline && `due ${shortDate(o.next_deadline.at, o.date_precision[o.next_deadline.field], o.timezone)}`]
        .filter(Boolean)
        .join(" · "),
      icon: <CategoryIcon category={o.category} className="size-4" />,
      run: () => go(`/opportunities/${o.id}`),
    }));
    if (q) {
      out.push({
        id: "search-all",
        group: "Search",
        label: `Search all opportunities for “${query.trim()}”`,
        icon: <Search className="size-4 text-muted-foreground" aria-hidden />,
        run: () => go(`/opportunities?q=${encodeURIComponent(query.trim())}`),
      });
    }
    for (const n of NAV_ALL) {
      if (!q || n.label.toLowerCase().includes(q)) {
        out.push({
          id: `nav-${n.href}`,
          group: "Go to",
          label: n.label,
          icon: <n.icon className="size-4 text-muted-foreground" aria-hidden />,
          run: () => go(n.href),
        });
      }
    }
    for (const a of APPEARANCE_OPTIONS) {
      const text = `${a.label} appearance`;
      if (!q || text.toLowerCase().includes(q) || "theme appearance dark light glass".includes(q)) {
        out.push({
          id: `appearance-${a.value}`,
          group: "Appearance",
          label: a.value === "system" ? "Match system appearance" : `Use ${a.label}`,
          icon: <a.icon className="size-4 text-muted-foreground" aria-hidden />,
          run: () => {
            saveAppearance({ appearance: a.value });
            close();
          },
        });
      }
    }
    return out;
  }, [results, searching, query, go, close]);

  const clamped = Math.min(active, Math.max(items.length - 1, 0));
  const activeId = items[clamped] ? `${listId}-${items[clamped].id}` : undefined;

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[clamped]?.run();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search and commands"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="floating fixed inset-x-0 top-[12dvh] mx-auto mt-0 w-[min(40rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-xl p-0 text-foreground open:animate-pop"
    >
      <div className="flex items-center gap-3 border-b border-rule px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Search opportunities, pages and commands"
          placeholder="Search opportunities, or type a page name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          maxLength={200}
          className="h-13 min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none focus-visible:outline-none"
        />
        <kbd className="hidden rounded border border-control px-1.5 py-0.5 text-xs text-muted-foreground sm:block">Esc</kbd>
      </div>

      <ul id={listId} role="listbox" aria-label="Results" className="max-h-[min(26rem,60dvh)] overflow-y-auto overscroll-contain p-1.5">
        {items.map((item, i) => {
          const header = i === 0 || items[i - 1].group !== item.group ? item.group : null;
          return (
            <li key={item.id} role="presentation">
              {header && (
                <p role="presentation" className="px-2.5 pt-2.5 pb-1 text-xs text-muted-foreground">
                  {header}
                </p>
              )}
              <div
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={i === clamped}
                onPointerMove={() => setActive(i)}
                onClick={item.run}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 py-1.5 text-sm",
                  i === clamped && "bg-surface-2 glass:bg-surface/70",
                )}
              >
                {item.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
                </span>
                {i === clamped &&
                  (item.group === "Appearance" ? (
                    <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />
                  ) : (
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                  ))}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="flex h-9 items-center gap-4 border-t border-rule px-4 text-xs text-muted-foreground" aria-live="polite">
        {searching && state === "loading"
          ? "Searching…"
          : searching && state === "error"
            ? "Search is unavailable: the API could not be reached."
            : query.trim().length === 1
              ? "Type one more letter to search opportunities."
              : searching && state === "idle" && results.length === 0
                ? "No opportunities match that search."
                : "↑ ↓ to move · Enter to open"}
      </p>
    </dialog>
  );
}
