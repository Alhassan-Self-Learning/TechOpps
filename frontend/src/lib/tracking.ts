import type { TrackingStatus } from "@/lib/api";

/** The nine statuses, in the order an application moves through them. Mirrors the backend. */
export const TRACKING_STATUSES: TrackingStatus[] = [
  "interested",
  "planning",
  "applied",
  "registered",
  "accepted",
  "rejected",
  "attended",
  "completed",
  "withdrawn",
];
