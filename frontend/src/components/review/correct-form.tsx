"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label, Select, Textarea } from "@/components/ui/field";
import { ApiError, apiRequest, type OpportunityDetail, type TaxonomyResponse } from "@/lib/api";
import { DATE_FIELD_LABELS, label } from "@/lib/format";

const DATE_FIELDS = [
  "registration_opens_at",
  "registration_deadline",
  "application_deadline",
  "starts_at",
  "ends_at",
] as const;

const TEXT_FIELDS = [
  ["title", "Title"],
  ["organizer", "Organizer"],
  ["location_text", "Location"],
  ["url", "Link to original"],
  ["duration_text", "Duration"],
] as const;

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Values = Record<string, string>;

function initial(o: OpportunityDetail): Values {
  const v: Values = {
    category: o.category,
    subtype: o.subtype ?? "",
    summary: o.summary ?? "",
    eligibility: o.eligibility ?? "",
    delivery_mode: o.delivery_mode ?? "",
    cost_type: o.cost_type ?? "",
    skill_level: o.skill_level ?? "",
  };
  for (const [k] of TEXT_FIELDS) v[k] = (o[k] as string | null) ?? "";
  for (const k of DATE_FIELDS) v[k] = toLocalInput(o[k]);
  return v;
}

export function CorrectForm({ o, taxonomy }: { o: OpportunityDetail; taxonomy: TaxonomyResponse }) {
  const router = useRouter();
  const start = initial(o);
  const [v, setV] = useState<Values>(start);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value, ...(k === "category" ? { subtype: "" } : {}) }));
  const subtypes = taxonomy.categories.find((c) => c.value === v.category)?.subtypes ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const patch: Record<string, string | null> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === start[k]) continue;
      if ((DATE_FIELDS as readonly string[]).includes(k)) patch[k] = val ? new Date(val).toISOString() : null;
      else patch[k] = val.trim() === "" ? null : val.trim();
    }
    if ("category" in patch && !("subtype" in patch)) patch.subtype = v.subtype || null;
    if (Object.keys(patch).length === 0) {
      setMsg({ ok: true, text: "Nothing changed." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await apiRequest(`/api/v1/opportunities/${o.id}`, { method: "PATCH", body: patch });
      setMsg({ ok: true, text: `Saved ${Object.keys(patch).length} change(s). They are marked as your corrections.` });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  const select = (k: string, options: string[], text: string) => (
    <div>
      <Label htmlFor={`c-${k}`}>{text}</Label>
      <Select id={`c-${k}`} value={v[k]} onChange={set(k)}>
        <option value="">Not stated</option>
        {options.map((x) => <option key={x} value={x}>{label(x)}</option>)}
      </Select>
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-category">Category</Label>
          <Select id="c-category" value={v.category} onChange={set("category")}>
            {taxonomy.categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="c-subtype">Type</Label>
          <Select id="c-subtype" value={v.subtype} onChange={set("subtype")}>
            <option value="">Not stated</option>
            {subtypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {TEXT_FIELDS.map(([k, text]) => (
          <div key={k} className={k === "title" || k === "url" ? "sm:col-span-2" : undefined}>
            <Label htmlFor={`c-${k}`}>{text}</Label>
            <Input id={`c-${k}`} type={k === "url" ? "url" : "text"} value={v[k]} onChange={set(k)} required={k === "title"} />
          </div>
        ))}
        {select("delivery_mode", taxonomy.delivery_modes, "Format")}
        {select("cost_type", taxonomy.cost_types, "Cost")}
        {select("skill_level", taxonomy.skill_levels, "Level")}
        {DATE_FIELDS.map((k) => (
          <div key={k}>
            <Label htmlFor={`c-${k}`}>{DATE_FIELD_LABELS[k]}</Label>
            <Input id={`c-${k}`} type="datetime-local" value={v[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="c-summary">Summary</Label>
        <Textarea id="c-summary" rows={2} maxLength={1000} value={v.summary} onChange={set("summary")} />
      </div>
      <div>
        <Label htmlFor="c-eligibility">Eligibility</Label>
        <Textarea id="c-eligibility" rows={3} maxLength={4000} value={v.eligibility} onChange={set("eligibility")} />
      </div>
      <p className="text-xs text-muted-foreground">Dates use your device&apos;s time zone. Clear a field to mark it as not stated.</p>
      <div><Button type="submit" size="sm" disabled={busy}>Save corrections</Button></div>
      <FormMessage message={msg} />
    </form>
  );
}
