"use client";

import { createContext, use, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, controlClass } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import type { TaxonomyResponse } from "@/lib/api";
import { CATEGORY_SHORT } from "@/lib/categories";
import { label } from "@/lib/format";
import { activeFilterCount, NON_FILTER_PARAMS } from "@/lib/search-params";
import { cn } from "@/lib/utils";

import { CATEGORY_ICON } from "./category-badge";

/*
 * Discover controls. Every filter lives in the address bar (bookmarkable, shareable, back
 * button works); changing one replaces the URL inside a transition, so the current results stay
 * on screen, dimmed, until the new ones arrive.
 */

const LEARNING = ["course", "workshop", "bootcamp_program"];

type Ctx = {
  params: URLSearchParams;
  pending: boolean;
  push: (next: URLSearchParams) => void;
  toggle: (name: string, value: string) => void;
  setOne: (name: string, value: string) => void;
  clearAll: () => void;
};
const FilterContext = createContext<Ctx | null>(null);

function useFilters(): Ctx {
  const ctx = use(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside <DiscoverShell>");
  return ctx;
}

/** Provides filter state to every control and dims the results while a change loads. */
export function DiscoverShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Stable until the URL changes, so effects that depend on these functions do not re-run per render.
  const ctx = useMemo<Ctx>(() => {
    const params = new URLSearchParams(searchParams);
    const push = (next: URLSearchParams) => {
      next.delete("page");
      const s = next.toString();
      startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
    };
    return {
      params,
      pending: false,
      push,
      toggle: (name, value) => {
        const next = new URLSearchParams(params);
        const values = next.getAll(name);
        next.delete(name);
        for (const v of values.includes(value) ? values.filter((x) => x !== value) : [...values, value]) next.append(name, v);
        push(next);
      },
      setOne: (name, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(name, value);
        else next.delete(name);
        push(next);
      },
      clearAll: () => {
        const next = new URLSearchParams();
        const sort = params.get("sort");
        if (sort) next.set("sort", sort);
        push(next);
      },
    };
  }, [searchParams, router, pathname]);

  return <FilterContext value={{ ...ctx, pending }}>{children}</FilterContext>;
}

/** Wraps the results: dimmed and marked busy while a filter change is loading. */
export function ResultsFrame({ children }: { children: React.ReactNode }) {
  const { pending } = useFilters();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-[var(--dur-2)]", pending && "opacity-55")}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ search + categories */

export function SearchBar({ taxonomy }: { taxonomy: TaxonomyResponse }) {
  const { params, setOne } = useFilters();
  const current = params.get("q") ?? "";
  const [q, setQ] = useState(current);
  const [sheet, setSheet] = useState(false);
  const typed = useRef(false);
  const count = activeFilterCount(params) - (params.get("q") ? 1 : 0) - params.getAll("category").length;

  // Keep the box in step when the URL changes elsewhere (Clear all, a removed chip, back/forward).
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setQ(current);
  }

  // Search as you type, after a short pause; Enter searches at once.
  useEffect(() => {
    if (!typed.current) return;
    const value = q.trim();
    if (value === current || (value.length === 1)) return;
    const t = window.setTimeout(() => {
      typed.current = false;
      setOne("q", value);
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, current, setOne]);

  return (
    <div className="flex gap-2">
      <form
        role="search"
        className="relative min-w-0 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          typed.current = false;
          setOne("q", q.trim());
        }}
      >
        <label htmlFor="discover-q" className="sr-only">
          Search opportunities
        </label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="discover-q"
          type="search"
          value={q}
          onChange={(e) => {
            typed.current = true;
            setQ(e.target.value);
          }}
          placeholder="Search titles, organizers and descriptions"
          maxLength={200}
          enterKeyHint="search"
          className={cn(controlClass, "h-11 pr-10 pl-10 text-[0.9375rem] [&::-webkit-search-cancel-button]:hidden")}
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              typed.current = false;
              setQ("");
              setOne("q", "");
            }}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </form>
      <Button
        type="button"
        variant="outline"
        className="h-11 md:hidden"
        aria-haspopup="dialog"
        aria-expanded={sheet}
        onClick={() => setSheet(true)}
      >
        <SlidersHorizontal aria-hidden />
        Filters
        {count > 0 && (
          <span className="tabular grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{count}</span>
        )}
      </Button>
      <MobileFilters open={sheet} onClose={() => setSheet(false)} taxonomy={taxonomy} />
    </div>
  );
}

/** The eight categories as one row of toggles; several can be on at once. Scrolls on a phone. */
export function CategoryBar({ taxonomy }: { taxonomy: TaxonomyResponse }) {
  const { params, toggle, setOne } = useFilters();
  const selected = params.getAll("category");
  const chip =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-[background-color,border-color,color] duration-[var(--dur-1)]";
  return (
    <div role="group" aria-label="Category" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <button
        type="button"
        aria-pressed={selected.length === 0}
        onClick={() => setOne("category", "")}
        className={cn(chip, selected.length === 0 ? "border-primary bg-primary text-primary-foreground" : "border-control bg-surface text-muted-foreground hover:text-foreground")}
      >
        All categories
      </button>
      {taxonomy.categories.map((c) => {
        const on = selected.includes(c.value);
        const Icon = CATEGORY_ICON[c.value];
        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={on}
            title={c.description}
            onClick={() => toggle("category", c.value)}
            className={cn(
              chip,
              on ? "border-primary bg-primary text-primary-foreground" : "border-control bg-surface text-foreground hover:border-faint",
            )}
          >
            {Icon && <Icon className={cn("size-3.5", on ? "" : "text-muted-foreground")} aria-hidden />}
            {CATEGORY_SHORT[c.value] ?? c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ the filter rail */

function Group({ title, children, defaultOpen = true, active = 0 }: { title: string; children: React.ReactNode; defaultOpen?: boolean; active?: number }) {
  return (
    <details open={defaultOpen || active > 0} className="group border-b border-rule py-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {active > 0 && <span className="tabular ml-1.5 font-normal text-muted-foreground">{active}</span>}
        </span>
        <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-muted-foreground transition-transform duration-[var(--dur-2)] group-open:rotate-180">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pt-2.5">{children}</div>
    </details>
  );
}

function Checks({ name, options }: { name: string; options: { value: string; label: string }[] }) {
  const { params, toggle } = useFilters();
  const selected = params.getAll(name);
  return (
    <ul className="grid gap-0.5">
      {options.map((o) => (
        <li key={o.value}>
          <label className="-mx-1.5 flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm hover:bg-surface-2">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-[var(--primary)]"
              checked={selected.includes(o.value)}
              onChange={() => toggle(name, o.value)}
            />
            {o.label}
          </label>
        </li>
      ))}
    </ul>
  );
}

function Radios({ name, options }: { name: string; options: { value: string; label: string }[] }) {
  const { params, setOne } = useFilters();
  const value = params.get(name) ?? "";
  return (
    <ul className="grid gap-0.5">
      {options.map((o) => (
        <li key={o.value || "any"}>
          <label className="-mx-1.5 flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm hover:bg-surface-2">
            <input
              type="radio"
              name={`rail-${name}`}
              className="size-4 shrink-0 accent-[var(--primary)]"
              checked={value === o.value}
              onChange={() => setOne(name, o.value)}
            />
            {o.label}
          </label>
        </li>
      ))}
    </ul>
  );
}

/** A text filter applied on Enter or when focus leaves the box. */
function TextFilter({ name, label: text, placeholder, idPrefix }: { name: string; label: string; placeholder: string; idPrefix: string }) {
  const { params, setOne } = useFilters();
  const current = params.get(name) ?? "";
  const [value, setValue] = useState(current);
  // Follow the URL when it changes elsewhere (Clear all, a removed chip, back/forward).
  const [seen, setSeen] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setValue(current);
  }
  const id = `${idPrefix}-${name}`;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setOne(name, value.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        {text}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value.trim() !== current && setOne(name, value.trim())}
        placeholder={placeholder}
        maxLength={120}
      />
    </form>
  );
}

/** Start date range. The API takes datetimes; a day picks the whole day in UTC. */
function StartRange({ idPrefix }: { idPrefix: string }) {
  const { params, setOne } = useFilters();
  const from = (params.get("starts_at_from") ?? "").slice(0, 10);
  const to = (params.get("starts_at_to") ?? "").slice(0, 10);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label htmlFor={`${idPrefix}-from`} className="mb-1 block text-xs text-muted-foreground">
          From
        </label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setOne("starts_at_from", e.target.value ? `${e.target.value}T00:00:00Z` : "")}
          className="px-2"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-to`} className="mb-1 block text-xs text-muted-foreground">
          To
        </label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setOne("starts_at_to", e.target.value ? `${e.target.value}T23:59:59Z` : "")}
          className="px-2"
        />
      </div>
    </div>
  );
}

const YES_NO_ANY = [
  { value: "", label: "Any" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export function FilterRail({ taxonomy, idPrefix = "rail" }: { taxonomy: TaxonomyResponse; idPrefix?: string }) {
  const { params, setOne } = useFilters();
  const categories = params.getAll("category");
  const has = (c: string) => categories.includes(c);
  const n = (k: string) => params.getAll(k).length;

  return (
    <div>
      <Group title="Next deadline" active={n("deadline_within_days")}>
        <Radios
          name="deadline_within_days"
          options={[
            { value: "", label: "Any time" },
            { value: "7", label: "Within 7 days" },
            { value: "30", label: "Within 30 days" },
            { value: "90", label: "Within 90 days" },
          ]}
        />
      </Group>
      <Group title="Registration" active={n("registration_status")}>
        <Checks name="registration_status" options={["open", "upcoming", "closed", "unknown"].map((v) => ({ value: v, label: label(v) }))} />
      </Group>
      <Group title="Technology field" active={n("field")}>
        <Checks name="field" options={taxonomy.tech_fields} />
      </Group>
      <Group title="Format and place" active={n("delivery_mode") + n("location")}>
        <Checks name="delivery_mode" options={taxonomy.delivery_modes.map((v) => ({ value: v, label: label(v) }))} />
        <div className="mt-2.5">
          <TextFilter name="location" label="Location" placeholder="City or country" idPrefix={idPrefix} />
        </div>
      </Group>
      <Group title="Starts" active={n("starts_at_from") + n("starts_at_to")} defaultOpen={false}>
        <StartRange idPrefix={idPrefix} />
      </Group>
      <Group title="Organizer" active={n("organizer")} defaultOpen={false}>
        <TextFilter name="organizer" label="Organizer" placeholder="University, company, club" idPrefix={idPrefix} />
      </Group>
      <Group title="Cost" active={n("cost_type")} defaultOpen={false}>
        <Checks name="cost_type" options={taxonomy.cost_types.map((v) => ({ value: v, label: label(v) }))} />
      </Group>
      <Group title="Level" active={n("skill_level")} defaultOpen={false}>
        <Checks name="skill_level" options={taxonomy.skill_levels.map((v) => ({ value: v, label: label(v) }))} />
      </Group>

      {/* Filters that only mean something for the selected categories. */}
      {LEARNING.some(has) && (
        <Group title="Certificate" active={n("certificate")}>
          <Radios name="certificate" options={YES_NO_ANY} />
        </Group>
      )}
      {has("experience") && (
        <Group title="Compensation" active={n("compensation")}>
          <Checks name="compensation" options={["paid", "stipend", "unpaid"].map((v) => ({ value: v, label: label(v) }))} />
        </Group>
      )}
      {has("competition") && (
        <Group title="Competition" active={n("team_size") + n("has_prizes")}>
          <label htmlFor={`${idPrefix}-team`} className="mb-1 block text-xs text-muted-foreground">
            Team size allowed
          </label>
          <Select id={`${idPrefix}-team`} value={params.get("team_size") ?? ""} onChange={(e) => setOne("team_size", e.target.value)}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <option key={k} value={k}>
                {k === 1 ? "Solo" : `${k} people`}
              </option>
            ))}
          </Select>
          <p className="mt-3 mb-1 text-xs text-muted-foreground">Prizes</p>
          <Radios name="has_prizes" options={YES_NO_ANY} />
        </Group>
      )}
      {has("scholarship") && (
        <Group title="Funding" active={n("coverage")}>
          <Checks
            name="coverage"
            options={[
              { value: "full", label: "Fully funded" },
              { value: "partial", label: "Partially funded" },
            ]}
          />
        </Group>
      )}

      <Group title="Also show" active={n("include_past") + n("include_mock") + n("needs_review")} defaultOpen={false}>
        <ul className="grid gap-0.5">
          {[
            { name: "include_past", on: "true", text: "Past opportunities" },
            { name: "include_mock", on: "false", text: "Hide sample data" },
            { name: "needs_review", on: "true", text: "Only items needing review" },
          ].map((t) => (
            <li key={t.name}>
              <label className="-mx-1.5 flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm hover:bg-surface-2">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-[var(--primary)]"
                  checked={params.get(t.name) === t.on}
                  onChange={(e) => setOne(t.name, e.target.checked ? t.on : "")}
                />
                {t.text}
              </label>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

function MobileFilters({ open, onClose, taxonomy }: { open: boolean; onClose: () => void; taxonomy: TaxonomyResponse }) {
  const { params, clearAll, pending } = useFilters();
  const count = activeFilterCount(params);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title="Filters"
      description={count ? `${count} active` : "Filters apply as you choose them."}
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={clearAll} disabled={count === 0}>
            Clear all
          </Button>
          <Button type="button" className="h-11 flex-1" onClick={onClose}>
            {pending ? "Updating…" : "Show results"}
          </Button>
        </div>
      }
    >
      <FilterRail taxonomy={taxonomy} idPrefix="sheet" />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ toolbar */

function chipLabel(key: string, value: string, taxonomy: TaxonomyResponse): string {
  switch (key) {
    case "q":
      return `“${value}”`;
    case "category":
      return CATEGORY_SHORT[value] ?? label(value);
    case "field":
      return taxonomy.tech_fields.find((f) => f.value === value)?.label ?? label(value);
    case "deadline_within_days":
      return `Closing within ${value} days`;
    case "location":
      return `In ${value}`;
    case "organizer":
      return `By ${value}`;
    case "starts_at_from":
      return `Starts from ${value.slice(0, 10)}`;
    case "starts_at_to":
      return `Starts by ${value.slice(0, 10)}`;
    case "include_past":
      return "Including past";
    case "include_mock":
      return "Samples hidden";
    case "needs_review":
      return "Needs review";
    case "certificate":
      return value === "true" ? "With certificate" : "No certificate";
    case "has_prizes":
      return value === "true" ? "With prizes" : "No prizes";
    case "team_size":
      return value === "1" ? "Solo entry" : `Teams of ${value}`;
    case "coverage":
      return value === "full" ? "Fully funded" : "Partially funded";
    default:
      return label(value);
  }
}

/** Count, removable chips for every active filter, Clear all, and the sort order. */
export function ResultsToolbar({ taxonomy, total }: { taxonomy: TaxonomyResponse; total: number }) {
  const { params, push, setOne, clearAll } = useFilters();
  const chips = [...params.entries()].filter(([k]) => !NON_FILTER_PARAMS.has(k));
  const remove = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    const rest = next.getAll(key).filter((v) => v !== value);
    next.delete(key);
    rest.forEach((v) => next.append(key, v));
    push(next);
  };
  return (
    <div className="glass-bar sticky top-13 z-20 -mx-4 border-b border-transparent bg-background/95 px-4 py-2.5 sm:-mx-6 sm:px-6 md:top-0 md:mx-0 md:rounded-b-lg md:px-0 glass:md:border glass:md:px-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="tabular text-sm font-medium" aria-live="polite">
          {total.toLocaleString("en-GB")} {total === 1 ? "opportunity" : "opportunities"}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted-foreground">
            Sort
          </label>
          <Select
            id="sort"
            wrapperClassName="w-44"
            className="h-8"
            value={params.get("sort") ?? ""}
            onChange={(e) => setOne("sort", e.target.value)}
          >
            <option value="">{params.get("q") ? "Best match" : "Soonest deadline"}</option>
            {params.get("q") && <option value="deadline">Soonest deadline</option>}
            <option value="newest">Newest</option>
            <option value="starts">Start date</option>
            <option value="title">Title A–Z</option>
          </Select>
        </div>
      </div>
      {chips.length > 0 && (
        <ul aria-label="Active filters" className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map(([k, v]) => (
            <li key={`${k}=${v}`}>
              <button
                type="button"
                onClick={() => remove(k, v)}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-3 pr-1.5 pl-2.5 text-[0.8125rem] transition-colors hover:bg-control/60"
                aria-label={`Remove filter: ${chipLabel(k, v, taxonomy)}`}
              >
                {chipLabel(k, v, taxonomy)}
                <X className="size-3.5 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={clearAll} className="h-7 rounded-md px-2 text-[0.8125rem] font-medium underline-offset-4 hover:underline">
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
