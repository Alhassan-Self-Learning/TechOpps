"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FormMessage, Hint, Input, Select, Textarea } from "@/components/ui/field";
import { ApiError, type TrackingStatus, type UserState } from "@/lib/api";
import { formatDate, label } from "@/lib/format";
import { clearTracking, updateTracking } from "@/lib/mutations";

import { TRACKING_STATUSES } from "@/lib/tracking";

/** Convert an ISO timestamp to the value format of <input type="datetime-local"> (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TrackingPanel({ id, initial }: { id: string; initial: UserState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [target, setTarget] = useState(toLocalInput(initial.personal_deadline));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function save(patch: Parameters<typeof updateTracking>[1], okText: string) {
    setMessage(null);
    try {
      const next = await updateTracking(id, patch);
      setState(next);
      setMessage({ ok: true, text: okText });
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Could not save." });
    }
  }

  async function reset() {
    setMessage(null);
    try {
      await clearTracking(id);
      setState({ is_bookmarked: false, tracking_status: null, status_changed_at: null, notes: null, personal_deadline: null });
      setNotes("");
      setTarget("");
      setMessage({ ok: true, text: "Tracking cleared." });
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Could not clear." });
    }
  }

  const changed = notes !== (state.notes ?? "") || target !== toLocalInput(state.personal_deadline);

  return (
    <div className="grid gap-4">
      <div>
        <Field id="tracking-status" label="Status">
          <Select
            id="tracking-status"
            value={state.tracking_status ?? ""}
            disabled={pending}
            onChange={(e) =>
              save(
                { tracking_status: (e.target.value || null) as TrackingStatus | null },
                e.target.value ? `Marked as ${label(e.target.value).toLowerCase()}.` : "Status removed.",
              )
            }
          >
            <option value="">Not tracking</option>
            {TRACKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </Select>
        </Field>
        {state.status_changed_at && <Hint>Updated {formatDate(state.status_changed_at, "datetime")}</Hint>}
      </div>

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(
            {
              notes: notes.trim() ? notes : null,
              personal_deadline: target ? new Date(target).toISOString() : null,
            },
            "Notes and target date saved.",
          );
        }}
      >
        <Field id="personal-deadline" label="Your target date" hint="Your own reminder, kept apart from official deadlines.">
          <Input
            id="personal-deadline"
            type="datetime-local"
            aria-describedby="personal-deadline-hint"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </Field>
        <Field id="notes" label="Notes">
          <Textarea id="notes" rows={4} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant={changed ? "default" : "secondary"} disabled={pending}>
            Save notes and date
          </Button>
          {(state.tracking_status || state.notes || state.personal_deadline || state.is_bookmarked) && (
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={pending}>
              Clear tracking
            </Button>
          )}
        </div>
      </form>
      <FormMessage message={message} />
    </div>
  );
}
