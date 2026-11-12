/** Display helpers. Dates respect their stored precision: date-only values show no time. */

const DAY_MS = 86_400_000;

export const DATE_FIELD_LABELS: Record<string, string> = {
  published_at: "Published by source",
  first_collected_at: "Collected by TechOpps",
  starts_at: "Starts",
  ends_at: "Ends",
  registration_opens_at: "Registration opens",
  registration_deadline: "Registration deadline",
  application_deadline: "Application deadline",
  personal_deadline: "Your target date",
};

export const DEADLINE_VERB: Record<string, string> = {
  registration_deadline: "Register by",
  application_deadline: "Apply by",
  personal_deadline: "Your target",
};

export const ENUM_LABELS: Record<string, string> = {
  onsite: "On-site",
  online: "Online",
  hybrid: "Hybrid",
  free: "Free",
  paid: "Paid",
  free_with_paid_option: "Free, paid option",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All levels",
  open: "Open",
  upcoming: "Opens soon",
  closed: "Closed",
  unknown: "Status unknown",
  interested: "Interested",
  planning: "Planning",
  applied: "Applied",
  registered: "Registered",
  accepted: "Accepted",
  rejected: "Rejected",
  attended: "Attended",
  completed: "Completed",
  withdrawn: "Withdrawn",
  rss: "RSS feed",
  atom: "Atom feed",
  api: "JSON API",
  web_page: "Web page",
  manual: "Manual entry",
};

export function label(value: string | null | undefined): string {
  if (!value) return "";
  return ENUM_LABELS[value] ?? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function formatDate(
  iso: string | null | undefined,
  precision: "date" | "datetime" = "datetime",
  timeZone?: string | null,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  // A date-only value (e.g. "deadline: 20 Nov") is stored as end of that day in the
  // opportunity's zone, or UTC when no zone was stated. Showing it in the viewer's zone could
  // move it to another day, so date-only values are always shown in the zone they were stored in.
  const zone = timeZone || (precision === "date" ? "UTC" : undefined);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(zone ? { timeZone: zone } : {}),
  };
  if (precision === "datetime") {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
    opts.timeZoneName = "short";
  }
  try {
    return d.toLocaleString("en-GB", opts);
  } catch {
    // Unknown IANA zone from a source: fall back to the viewer's zone.
    delete opts.timeZone;
    return d.toLocaleString("en-GB", opts);
  }
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.floor((new Date(iso).getTime() - now.getTime()) / DAY_MS);
}

export function relativeDays(iso: string, now: Date = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms < 0) return "passed";
  const days = Math.floor(ms / DAY_MS);
  if (days === 0) {
    const hours = Math.max(1, Math.floor(ms / 3_600_000));
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** Only http(s) links from collected data may become clickable. */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Calendar day (y, m, d) a deadline belongs to, honouring date-only precision. */
export function calendarDay(
  iso: string,
  precision: "date" | "datetime" | undefined,
  timeZone: string | null | undefined,
): { y: number; m: number; d: number } {
  const zone = timeZone || (precision === "date" ? "UTC" : undefined);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(zone ? { timeZone: zone } : {}),
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

/**
 * Compact date for lists and the runway: "Fri 15 Nov", plus "18:00" when a time was stated.
 * Same zone rules as `formatDate`, so a date-only deadline never moves to another day.
 */
export function shortDate(
  iso: string,
  precision: "date" | "datetime" = "datetime",
  timeZone?: string | null,
  withWeekday = true,
): string {
  const zone = timeZone || (precision === "date" ? "UTC" : undefined);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(withWeekday ? { weekday: "short" } : {}),
    ...(precision === "datetime" ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
    ...(zone ? { timeZone: zone } : {}),
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(new Date(iso));
  } catch {
    delete opts.timeZone;
    parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(new Date(iso));
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = [get("weekday"), get("day"), get("month")].filter(Boolean).join(" ");
  return precision === "datetime" ? `${day}, ${get("hour")}:${get("minute")}` : day;
}

/** "3 min ago", "5 h ago", "2 days ago" for collection and run times. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const s = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
