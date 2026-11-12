/**
 * Appearance: Light, Dark or Liquid Glass, with the system setting as the default.
 *
 * The choice lives in localStorage so the static shell stays prerendered (reading a cookie in
 * the root layout would make every page dynamic). An inline script in <head> applies it before
 * the first paint, so there is no flash of the wrong theme; see `APPEARANCE_SCRIPT`.
 *
 * <html> carries the result:
 *   data-theme="light" | "dark"   which token set applies
 *   data-glass                    present in Liquid Glass (translucent floating surfaces)
 *   data-appearance               the stored choice, for components that show it
 */

export type Appearance = "system" | "light" | "dark" | "glass";
export type Tone = "system" | "light" | "dark";

export const APPEARANCE_KEY = "techopps-appearance";
export const GLASS_TONE_KEY = "techopps-glass-tone";
export const APPEARANCE_EVENT = "techopps:appearance";

const APPEARANCES: readonly Appearance[] = ["system", "light", "dark", "glass"];
const TONES: readonly Tone[] = ["system", "light", "dark"];

export function parseAppearance(value: string | null | undefined): Appearance {
  return APPEARANCES.includes(value as Appearance) ? (value as Appearance) : "system";
}

export function parseTone(value: string | null | undefined): Tone {
  return TONES.includes(value as Tone) ? (value as Tone) : "system";
}

/** Which token set an appearance resolves to, given whether the system prefers dark. */
export function resolveTheme(appearance: Appearance, tone: Tone, systemDark: boolean): "light" | "dark" {
  const t = appearance === "glass" ? tone : appearance;
  return t === "dark" || (t === "system" && systemDark) ? "dark" : "light";
}

/**
 * Runs synchronously in <head> during HTML parsing. Kept dependency-free and wrapped in
 * try/catch: storage can be unavailable (private mode, blocked cookies).
 */
export const APPEARANCE_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage,a=s.getItem("${APPEARANCE_KEY}"),t=s.getItem("${GLASS_TONE_KEY}");a=["light","dark","glass"].indexOf(a)<0?"system":a;t=["light","dark"].indexOf(t)<0?"system":t;var m=window.matchMedia("(prefers-color-scheme: dark)").matches,v=a==="glass"?t:a,k=v==="dark"||(v==="system"&&m);d.setAttribute("data-theme",k?"dark":"light");d.setAttribute("data-appearance",a);if(a==="glass")d.setAttribute("data-glass","");else d.removeAttribute("data-glass")}catch(e){}})()`;

function read(): { appearance: Appearance; tone: Tone } {
  try {
    return {
      appearance: parseAppearance(localStorage.getItem(APPEARANCE_KEY)),
      tone: parseTone(localStorage.getItem(GLASS_TONE_KEY)),
    };
  } catch {
    return { appearance: "system", tone: "system" };
  }
}

/** Applies the stored choice to <html>. `animate` cross-fades colours while switching. */
export function applyAppearance(animate = false): void {
  const { appearance, tone } = read();
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animate && !reduce) {
    root.classList.add("appearance-switching");
    window.setTimeout(() => root.classList.remove("appearance-switching"), 280);
  }
  root.setAttribute("data-theme", resolveTheme(appearance, tone, systemDark));
  root.setAttribute("data-appearance", appearance);
  root.toggleAttribute("data-glass", appearance === "glass");
}

export function saveAppearance(next: { appearance?: Appearance; tone?: Tone }): void {
  try {
    if (next.appearance) localStorage.setItem(APPEARANCE_KEY, next.appearance);
    if (next.tone) localStorage.setItem(GLASS_TONE_KEY, next.tone);
  } catch {
    /* storage unavailable: the choice still applies for this page view */
  }
  applyAppearance(true);
  window.dispatchEvent(new Event(APPEARANCE_EVENT));
}

/** Snapshot for useSyncExternalStore: "<appearance>|<tone>". */
export function appearanceSnapshot(): string {
  const { appearance, tone } = read();
  return `${appearance}|${tone}`;
}

export function subscribeAppearance(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    applyAppearance(true);
    onChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === APPEARANCE_KEY || e.key === GLASS_TONE_KEY) {
      applyAppearance(true);
      onChange();
    }
  };
  media.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage); // another tab changed it
  window.addEventListener(APPEARANCE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(APPEARANCE_EVENT, onChange);
  };
}
