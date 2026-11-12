"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

import { CategoryIcon } from "@/components/opportunities/category-badge";
import type { DashboardDeadline } from "@/lib/api";
import { calendarDay, DEADLINE_VERB, formatDate, relativeDays, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK = 7;

// "Today" is computed in the viewer's browser so day boundaries follow their own timezone.
// The server snapshot is null, which renders the frame without marks instead of a wrong day.
function subscribe() {
  return () => {};
}
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
// The current minute, read the same way, so "now" and "within a week" never differ between
// server and client render.
function getMinute() {
  return Math.floor(Date.now() / 60_000);
}
function useNowMs(): number | null {
  const minute = useSyncExternalStore(subscribe, getMinute, () => null);
  return minute === null ? null : minute * 60_000;
}
function useToday(): Date | null {
  const key = useSyncExternalStore(subscribe, getTodayKey, () => null);
  if (key === null) return null;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m, d);
}

const keyOf = (d: DashboardDeadline) => `${d.id}-${d.field}`;

type Placed = DashboardDeadline & { offset: number; level: number; key: string };

function place(deadlines: DashboardDeadline[], today: Date, days: number): Placed[] {
  const perLaneDay = new Map<string, number>();
  return deadlines
    .map((d) => {
      let offset: number;
      if (d.precision === "date") {
        // A date-only deadline sits in the middle of its stated calendar day.
        const c = calendarDay(d.at, d.precision, d.timezone);
        offset = (new Date(c.y, c.m, c.d).getTime() - today.getTime()) / DAY_MS + 0.5;
      } else {
        offset = (new Date(d.at).getTime() - today.getTime()) / DAY_MS;
      }
      return { ...d, offset };
    })
    .filter((d) => d.offset >= 0 && d.offset < days)
    .map((d) => {
      // Marks on the same day in the same lane stack upwards so none hide each other.
      const slot = `${d.is_bookmarked ? "s" : "o"}-${Math.floor(d.offset)}`;
      const level = perLaneDay.get(slot) ?? 0;
      perLaneDay.set(slot, level + 1);
      return { ...d, level, key: keyOf(d) };
    });
}

/**
 * The dashboard's signature: the next 30 days as a runway. Two lanes (what you saved, everything
 * else collected), one mark per deadline (filled: official, hollow: your own target date), this
 * week marked in amber on the axis. Beside it, the same deadlines as a list; pointing at either
 * highlights both.
 */
export function DeadlineRunway({ deadlines, days = 30 }: { deadlines: DashboardDeadline[]; days?: number }) {
  const today = useToday();
  const nowMs = useNowMs();
  const [hot, setHot] = useState<string | null>(null);
  const placed = today ? place(deadlines, today, days) : [];
  const nowOffset = today && nowMs !== null ? (nowMs - today.getTime()) / DAY_MS : 0;
  const pct = (offset: number) => `${(offset / days) * 100}%`;

  const ticks = today
    ? Array.from({ length: days }, (_, i) => new Date(today.getTime() + i * DAY_MS))
    : [];
  const hotItem = placed.find((p) => p.key === hot);
  const list = deadlines.slice(0, 6);

  return (
    <div className="grid gap-x-8 gap-y-6 px-5 pt-2 pb-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* The runway */}
      <figure className="flex min-w-0 flex-col">
        <div className="grid min-h-36 flex-1 grid-cols-[3.75rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)]">
          <div className="grid grid-rows-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Bookmark className="size-3.5" aria-hidden /> Saved
            </span>
            <span className="flex items-center">Others</span>
          </div>

          <div className="relative" onPointerLeave={() => setHot(null)}>
            {/* Day columns: weekends one step darker, faint lines between days. */}
            <div aria-hidden className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
              {ticks.map((day, i) => (
                <span
                  key={i}
                  className={cn(
                    "border-l border-rule first:border-l-0",
                    (day.getDay() === 0 || day.getDay() === 6) && "bg-surface-2/60",
                  )}
                />
              ))}
            </div>
            <div className="relative grid h-full grid-rows-2">
              <div className="border-b border-rule" />
              <div />
            </div>
            {today && (
              <span
                aria-hidden
                className="absolute inset-y-0 w-px bg-foreground/70"
                style={{ left: pct(nowOffset) }}
              />
            )}

            {placed.map((d) => {
              const personal = d.field === "personal_deadline";
              const lane = d.is_bookmarked ? 0 : 1;
              const active = hot === d.key;
              const label = `${d.title}: ${DEADLINE_VERB[d.field].toLowerCase()} ${formatDate(d.at, d.precision, d.timezone)}`;
              return (
                <Link
                  key={d.key}
                  href={`/opportunities/${d.id}`}
                  aria-label={label}
                  onPointerEnter={() => setHot(d.key)}
                  onFocus={() => setHot(d.key)}
                  onBlur={() => setHot(null)}
                  className="absolute z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full focus-visible:outline-offset-0"
                  style={{ left: pct(d.offset), top: `calc(${lane * 50 + 25}% - 0.625rem - ${d.level * 0.75}rem)` }}
                >
                  <span
                    className={cn(
                      "block size-2.5 rounded-full border-2 border-signal transition-transform duration-[var(--dur-1)]",
                      personal ? "bg-surface" : "bg-signal",
                      active && "scale-150",
                    )}
                  />
                </Link>
              );
            })}

            {hotItem && (
              <div
                role="status"
                className="floating pointer-events-none absolute z-20 w-max max-w-64 rounded-md px-2.5 py-1.5 text-xs animate-pop"
                style={{
                  left: `clamp(0px, calc(${pct(hotItem.offset)} - 4rem), calc(100% - 16rem))`,
                  bottom: "calc(100% + 0.25rem)",
                }}
              >
                <span className="block truncate font-medium">{hotItem.title}</span>
                <span className="text-muted-foreground">
                  {DEADLINE_VERB[hotItem.field]} {shortDate(hotItem.at, hotItem.precision, hotItem.timezone)} · {relativeDays(hotItem.at)}
                </span>
              </div>
            )}

            {today && placed.length === 0 && (
              <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                No deadlines in the next {days} days.
              </p>
            )}
          </div>
        </div>

        {/* Axis: this week in amber, then Mondays. */}
        <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)]">
          <span />
          <div aria-hidden className="relative mt-1.5 h-9">
            <span className="absolute top-0 left-0 h-1 rounded-full bg-urgent-mark" style={{ width: pct(WEEK) }} />
            <span className="absolute top-2 left-0 text-xs font-medium text-urgent">This week</span>
            {ticks.map((day, i) =>
              day.getDay() === 1 && i >= WEEK - 1 ? (
                <span key={i} className="tabular absolute top-2 text-xs whitespace-nowrap text-muted-foreground" style={{ left: pct(i) }}>
                  <span className="absolute -top-2 left-0 h-1.5 w-px bg-control" />
                  {day.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              ) : null,
            )}
          </div>
        </div>
        <figcaption className="sr-only">
          Deadlines in the next {days} days. Saved opportunities on the upper lane. Filled marks are official deadlines,
          hollow marks are your own target dates. The same deadlines are listed next to the chart.
        </figcaption>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-signal bg-signal" /> Official deadline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-signal bg-surface" /> Your target date
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px bg-foreground/70" /> Now
          </span>
        </div>
      </figure>

      {/* The same deadlines, in order */}
      <div className="min-w-0">
        <h3 className="mb-1 text-sm font-medium">Due next</h3>
        {list.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nothing is due in the next {days} days.</p>
        ) : (
          <ol className="divide-y divide-rule" onPointerLeave={() => setHot(null)}>
            {list.map((d) => {
              const k = keyOf(d);
              const soon = nowMs !== null && (new Date(d.at).getTime() - nowMs) / DAY_MS <= WEEK;
              return (
                <li key={k}>
                  <Link
                    href={`/opportunities/${d.id}`}
                    onPointerEnter={() => setHot(k)}
                    onFocus={() => setHot(k)}
                    onBlur={() => setHot(null)}
                    className={cn(
                      "-mx-2 grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-[var(--dur-1)]",
                      hot === k ? "bg-surface-2" : "hover:bg-surface-2",
                    )}
                  >
                    <span className="leading-tight">
                      <span className="block text-sm font-medium" suppressHydrationWarning>
                        {shortDate(d.at, d.precision, d.timezone, false).replace(/, \d{2}:\d{2}$/, "")}
                      </span>
                      <span className={cn("tabular block text-xs", soon ? "font-medium text-urgent" : "text-muted-foreground")} suppressHydrationWarning>
                        {relativeDays(d.at)}
                      </span>
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="flex items-center gap-1.5">
                        <CategoryIcon category={d.category} />
                        <span className="truncate text-sm">{d.title}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {DEADLINE_VERB[d.field]}
                        {d.is_bookmarked && " · saved"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        {deadlines.length > list.length && (
          <Link href="/opportunities?deadline_within_days=30" className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline">
            All {deadlines.length} deadlines
          </Link>
        )}
      </div>
    </div>
  );
}
