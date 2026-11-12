// Unit tests for display helpers. Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { calendarDay, formatDate, relativeDays, safeHref, shortDate, timeAgo } from "./format.ts";

test("date-only deadline without a zone keeps its stated day for any viewer", () => {
  // "Register by 20 November" stored as end of that day in UTC.
  const iso = "2026-11-20T23:59:59+00:00";
  assert.equal(formatDate(iso, "date", null), "20 Nov 2026");
  assert.deepEqual(calendarDay(iso, "date", null), { y: 2026, m: 10, d: 20 });
});

test("date-only deadline in a stated zone is shown in that zone", () => {
  const iso = "2026-11-20T19:59:59+00:00"; // 23:59:59 in Asia/Muscat
  assert.equal(formatDate(iso, "date", "Asia/Muscat"), "20 Nov 2026");
});

test("datetime values include the time", () => {
  assert.match(formatDate("2026-11-20T10:30:00+00:00", "datetime", "UTC"), /10:30/);
});

test("relative days", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  assert.equal(relativeDays("2026-11-04T12:00:00Z", now), "in 3 days");
  assert.equal(relativeDays("2026-11-02T13:00:00Z", now), "tomorrow");
  assert.equal(relativeDays("2026-11-01T15:00:00Z", now), "in 3 hours");
  assert.equal(relativeDays("2026-10-30T00:00:00Z", now), "passed");
});

test("only http(s) links become clickable", () => {
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("data:text/html,hi"), null);
  assert.equal(safeHref("not a url"), null);
  assert.equal(safeHref("https://example.org/a"), "https://example.org/a");
});

test("short dates keep a date-only deadline on its stated day", () => {
  const iso = "2026-11-20T19:59:59+00:00"; // 23:59:59 in Asia/Muscat
  assert.equal(shortDate(iso, "date", "Asia/Muscat"), "Fri 20 Nov");
  assert.equal(shortDate("2026-11-20T10:30:00+00:00", "datetime", "UTC", false), "20 Nov, 10:30");
});

test("time ago", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  assert.equal(timeAgo("2026-11-01T11:59:30Z", now), "just now");
  assert.equal(timeAgo("2026-11-01T11:20:00Z", now), "40 min ago");
  assert.equal(timeAgo("2026-11-01T07:00:00Z", now), "5 h ago");
  assert.equal(timeAgo("2026-10-29T12:00:00Z", now), "3 days ago");
});
