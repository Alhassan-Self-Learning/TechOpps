/**
 * Typed client for the TechOpps API.
 *
 * Server components call the API directly over the internal network (API_INTERNAL_URL).
 * Browser code calls same-origin `/api/...`, which Next.js rewrites to the API, so no
 * CORS configuration or API URL is exposed to the client.
 */

export type HealthResponse = {
  status: "ok" | "degraded";
  version: string;
  environment: string;
  database: "ok" | "unavailable";
  ai_configured: boolean;
};

export type Option = { value: string; label: string };

export type CategoryInfo = {
  value: string;
  label: string;
  description: string;
  subtypes: Option[];
};

export type TaxonomyResponse = {
  categories: CategoryInfo[];
  tech_fields: Option[];
  delivery_modes: string[];
  cost_types: string[];
  skill_levels: string[];
  tracking_statuses: string[];
  date_fields: string[];
};

export type RegistrationStatus = "open" | "upcoming" | "closed" | "unknown";
export type TrackingStatus =
  | "interested"
  | "planning"
  | "applied"
  | "registered"
  | "accepted"
  | "rejected"
  | "attended"
  | "completed"
  | "withdrawn";

export type UserState = {
  is_bookmarked: boolean;
  tracking_status: TrackingStatus | null;
  status_changed_at: string | null;
  notes: string | null;
  personal_deadline: string | null;
};

export type DateField =
  | "published_at"
  | "first_collected_at"
  | "starts_at"
  | "ends_at"
  | "registration_opens_at"
  | "registration_deadline"
  | "application_deadline";

export type OpportunityListItem = {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  category: string;
  subtype: string | null;
  organizer: string | null;
  location_text: string | null;
  country_code: string | null;
  city: string | null;
  delivery_mode: string | null;
  cost_type: string | null;
  skill_level: string | null;
  timezone: string | null;
  published_at: string | null;
  first_collected_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  registration_opens_at: string | null;
  registration_deadline: string | null;
  application_deadline: string | null;
  date_precision: Record<string, "date" | "datetime">;
  registration_status: RegistrationStatus;
  next_deadline: { field: "registration_deadline" | "application_deadline"; at: string } | null;
  tech_fields: Option[];
  is_mock: boolean;
  needs_review: boolean;
  extraction_confidence: number | null;
  user: UserState;
};

export type Provenance = {
  source_id: string;
  source_name: string;
  source_kind: string;
  raw_item_id: string;
  raw_url: string | null;
  collected_at: string;
  source_published_at: string | null;
  is_primary: boolean;
  ai_extraction_id: string | null;
  ai_model: string | null;
  ai_prompt_version: string | null;
};

export type OpportunityDetail = OpportunityListItem & {
  description: string | null;
  eligibility: string | null;
  language: string | null;
  cost_amount: string | null;
  cost_currency: string | null;
  funding_details: string | null;
  duration_text: string | null;
  last_seen_at: string | null;
  reported_registration_state: string | null;
  category_details: Record<string, unknown>;
  tags: Option[];
  field_provenance: Record<string, { origin?: string; extraction_id?: string }>;
  review_reasons: string[];
  record_status: string;
  sources: Provenance[];
};

export type Page<T> = { items: T[]; total: number; page: number; page_size: number };

export type DashboardDeadline = {
  id: string;
  title: string;
  category: string;
  field: "registration_deadline" | "application_deadline" | "personal_deadline";
  at: string;
  precision: "date" | "datetime";
  timezone: string | null;
  is_bookmarked: boolean;
  is_mock: boolean;
};

export type DashboardResponse = {
  deadlines: DashboardDeadline[];
  recent: OpportunityListItem[];
  saved: OpportunityListItem[];
  category_counts: { category: string; count: number }[];
  total_active: number;
  needs_review: number;
  mock_count: number;
};

export type SourceKind = "rss" | "atom" | "api" | "web_page" | "manual";

export type SourceOut = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  description: string | null;
  is_active: boolean;
  activated_at: string | null;
  config: Record<string, unknown>;
  fetch_interval_minutes: number;
  access_notes: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  last_error: string | null;
  consecutive_failures: number;
  created_at: string;
  next_run_at: string | null;
  raw_items: number;
  pending_items: number;
  opportunities: number;
};

export type RunOut = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "partial" | "failed";
  trigger: string;
  items_found: number;
  items_new: number;
  error: string | null;
  details: { warnings?: string[] };
};

export type SourceDetail = SourceOut & { runs: RunOut[] };

export type RawItemOut = {
  id: string;
  title: string | null;
  url: string | null;
  content_type: string;
  content_preview: string;
  source_published_at: string | null;
  collected_at: string;
  processing_status: "pending" | "processed" | "failed" | "skipped";
  processing_error: string | null;
  opportunity_id: string | null;
};

export type DuplicatePair = {
  id: string;
  score: number;
  method: string;
  reasons: string[];
  created_at: string;
  a: OpportunityListItem;
  b: OpportunityListItem;
};

export type UsageBucket = {
  key: string;
  calls: number;
  succeeded: number;
  failed: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: string | null;
  cost_complete: boolean;
};

export type AIUsage = {
  provider: string;
  model: string;
  configured: boolean;
  pending_items: number;
  failed_items: number;
  totals: UsageBucket;
  by_day: UsageBucket[];
  by_model: UsageBucket[];
  pricing_configured: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isServer = typeof window === "undefined";

function baseUrl(): string {
  if (!isServer) return "";
  return process.env.API_INTERNAL_URL ?? "http://localhost:8000";
}

/** Server-side only: the shared secret for hosted backends. Never available in the browser. */
function serverSecretHeader(): Record<string, string> {
  return isServer && process.env.API_SECRET ? { "X-TechOpps-Secret": process.env.API_SECRET } : {};
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
      const d = body.detail[0];
      const where = Array.isArray(d.loc) ? d.loc.slice(1).join(".") : "";
      return where ? `${where}: ${d.msg}` : d.msg;
    }
    if (typeof body?.error?.message === "string") return body.error.message;
  } catch {
    /* not JSON */
  }
  return `The API answered ${res.status}.`;
}

export async function apiRequest<T>(
  path: string,
  init?: { method?: string; body?: unknown; timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  // Generous default: a free hosted backend can take ~1 minute to wake up.
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 75000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: init?.method ?? "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // Required by the API for requests that change data (cross-site request protection).
        "X-TechOpps-Client": "web",
        ...serverSecretHeader(),
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("The API could not be reached.", null);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiGet = <T,>(path: string) => apiRequest<T>(path);

export function toQuery(params: Record<string, string | string[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    for (const v of Array.isArray(value) ? value : [value]) if (v !== "") sp.append(key, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  health: () => apiGet<HealthResponse>("/api/v1/health"),
  taxonomy: () => apiGet<TaxonomyResponse>("/api/v1/taxonomy"),
  dashboard: () => apiGet<DashboardResponse>("/api/v1/dashboard"),
  opportunities: (query: string) =>
    apiGet<Page<OpportunityListItem>>(`/api/v1/opportunities${query}`),
  sources: () => apiGet<SourceOut[]>("/api/v1/sources"),
  source: (id: string) => apiGet<SourceDetail>(`/api/v1/sources/${encodeURIComponent(id)}`),
  sourceItems: (id: string) =>
    apiGet<RawItemOut[]>(`/api/v1/sources/${encodeURIComponent(id)}/items`),
  duplicates: () => apiGet<DuplicatePair[]>("/api/v1/review/duplicates"),
  aiUsage: () => apiGet<AIUsage>("/api/v1/ai/usage"),
  opportunity: (id: string) =>
    apiGet<OpportunityDetail>(`/api/v1/opportunities/${encodeURIComponent(id)}`),
};
