export type RawSearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(raw: RawSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    for (const one of Array.isArray(v) ? v : [v]) sp.append(k, one);
  }
  return sp;
}

/** Parameters that order or page a list rather than filter it. */
export const NON_FILTER_PARAMS = new Set(["sort", "page", "page_size"]);

export function activeFilterCount(params: URLSearchParams): number {
  return [...params.keys()].filter((k) => !NON_FILTER_PARAMS.has(k)).length;
}
