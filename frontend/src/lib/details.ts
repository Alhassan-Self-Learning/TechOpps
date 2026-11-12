/** Turns category_details JSON into readable rows, combining ranges like team size. */
import { label } from "@/lib/format";

const KEY_LABEL: Record<string, string> = {
  certificate: "Certificate",
  certificate_cost: "Certificate cost",
  hours_per_week: "Hours per week",
  prerequisites: "Prerequisites",
  seats: "Seats",
  commitment: "Commitment",
  remote_possible: "Remote possible",
  compensation: "Compensation",
  employment_type: "Employment type",
  work_authorization: "Work authorization",
  has_prizes: "Prizes",
  prize_summary: "Prize details",
  format: "Format",
  rounds: "Rounds",
  venue: "Venue",
  agenda_url: "Agenda",
  speakers: "Speakers",
  coverage: "Coverage",
  covers: "Covers",
  study_level: "Study level",
  renewable: "Renewable",
};

function value(v: unknown): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map((x) => label(String(x))).join(", ");
  if (typeof v === "number") return String(v);
  return label(String(v));
}

function range(min: unknown, max: unknown, suffix = ""): string {
  if (min != null && max != null) return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`;
  if (min != null) return `${min}+${suffix}`;
  return `up to ${max}${suffix}`;
}

export function detailRows(d: Record<string, unknown>): { term: string; value: string }[] {
  const rows: { term: string; value: string }[] = [];
  const used = new Set<string>();
  if (d.team_size_min != null || d.team_size_max != null) {
    rows.push({ term: "Team size", value: range(d.team_size_min, d.team_size_max, " people") });
    used.add("team_size_min").add("team_size_max");
  }
  if (d.salary_min != null || d.salary_max != null) {
    const cur = d.salary_currency ? ` ${d.salary_currency}` : "";
    const per = d.salary_period ? ` per ${d.salary_period}` : "";
    rows.push({ term: "Pay", value: range(d.salary_min, d.salary_max) + cur + per });
    ["salary_min", "salary_max", "salary_currency", "salary_period"].forEach((k) => used.add(k));
  }
  if (d.prize_pool_amount != null) {
    rows.push({ term: "Prize pool", value: `${d.prize_pool_amount} ${d.prize_pool_currency ?? ""}`.trim() });
    used.add("prize_pool_amount").add("prize_pool_currency");
  }
  if (d.amount != null) {
    rows.push({ term: "Amount", value: `${d.amount} ${d.amount_currency ?? ""}`.trim() });
    used.add("amount").add("amount_currency");
  }
  for (const [k, v] of Object.entries(d)) {
    if (used.has(k) || v == null) continue;
    rows.push({ term: KEY_LABEL[k] ?? label(k), value: value(v) });
  }
  return rows;
}
