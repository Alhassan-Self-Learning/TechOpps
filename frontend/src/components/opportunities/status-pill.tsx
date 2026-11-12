import { Badge } from "@/components/ui/badge";
import type { RegistrationStatus, TrackingStatus } from "@/lib/api";
import { label } from "@/lib/format";

const REGISTRATION_TONE = {
  open: "ok",
  upcoming: "signal",
  closed: "neutral",
  unknown: "outline",
} as const;

/** Registration state of the opportunity itself (open, opens soon, closed, unknown). */
export function StatusPill({ status }: { status: RegistrationStatus }) {
  return <Badge tone={REGISTRATION_TONE[status]}>{label(status)}</Badge>;
}

/** Where the user's own application stands. Outcomes get their meaning colour; the rest stay grey. */
const TRACKING_TONE: Record<TrackingStatus, "neutral" | "signal" | "ok" | "danger" | "outline"> = {
  interested: "neutral",
  planning: "neutral",
  applied: "signal",
  registered: "signal",
  accepted: "ok",
  attended: "ok",
  completed: "ok",
  rejected: "danger",
  withdrawn: "outline",
};

export function TrackingPill({ status }: { status: TrackingStatus }) {
  return <Badge tone={TRACKING_TONE[status]}>{label(status)}</Badge>;
}
