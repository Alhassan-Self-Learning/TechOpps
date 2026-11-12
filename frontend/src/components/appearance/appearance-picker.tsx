"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Droplet, Monitor, Moon, Sun } from "lucide-react";

import { Segmented } from "@/components/ui/segmented";
import {
  applyAppearance,
  appearanceSnapshot,
  parseAppearance,
  parseTone,
  saveAppearance,
  subscribeAppearance,
  type Appearance,
  type Tone,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

export const APPEARANCE_OPTIONS: { value: Appearance; label: string; icon: typeof Sun; hint: string }[] = [
  { value: "system", label: "System", icon: Monitor, hint: "Follows your device's light or dark setting." },
  { value: "light", label: "Light", icon: Sun, hint: "Neutral grey ground, white sheets." },
  { value: "dark", label: "Dark", icon: Moon, hint: "Soft charcoal surfaces, never pure black." },
  { value: "glass", label: "Liquid Glass", icon: Droplet, hint: "Translucent menus, bars and dialogs over a tinted ground." },
];

/** The stored appearance. Server render and hydration see "system"; then the real value. */
export function useAppearance(): { appearance: Appearance; tone: Tone } {
  const snap = useSyncExternalStore(subscribeAppearance, appearanceSnapshot, () => "system|system");
  const [a, t] = snap.split("|");
  return { appearance: parseAppearance(a), tone: parseTone(t) };
}

/** Mounted once in the shell. Re-applies the stored choice after React's dev remount resets <html>. */
export function AppearanceSync() {
  useLayoutEffect(() => applyAppearance(false), []);
  useAppearance(); // subscribes to system changes and other tabs
  return null;
}

/** Large picker for Settings: four labelled tiles with a small preview of each surface. */
export function AppearancePicker() {
  const { appearance, tone } = useAppearance();
  return (
    <div className="grid gap-5">
      <fieldset>
        <legend className="sr-only">Appearance</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {APPEARANCE_OPTIONS.map((o) => {
            const checked = appearance === o.value;
            return (
              <label
                key={o.value}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-surface p-2 transition-[border-color,box-shadow] duration-[var(--dur-1)]",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  checked ? "border-foreground outline outline-1 -outline-offset-2 outline-foreground" : "hover:border-control",
                )}
              >
                <input
                  type="radio"
                  name="appearance"
                  value={o.value}
                  checked={checked}
                  onChange={() => saveAppearance({ appearance: o.value })}
                  className="sr-only"
                />
                <Preview kind={o.value} />
                <span className="flex items-center gap-1.5 px-1 pb-0.5 text-sm font-medium">
                  <o.icon className="size-4 text-muted-foreground" aria-hidden />
                  {o.label}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {APPEARANCE_OPTIONS.find((o) => o.value === appearance)?.hint}
        </p>
      </fieldset>

      {appearance === "glass" && (
        <Segmented
          legend="Glass tone"
          value={tone}
          onChange={(v) => saveAppearance({ tone: v })}
          options={[
            { value: "system", label: "System", icon: Monitor },
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ]}
        />
      )}
    </div>
  );
}

/** A miniature of each appearance, drawn with fixed colours so every tile shows its own look. */
function Preview({ kind }: { kind: Appearance }) {
  const light = { ground: "#f2f4f7", sheet: "#ffffff", line: "#dde1e7", ink: "#0d1015", grey: "#c6ccd4" };
  const dark = { ground: "#0f1113", sheet: "#17191d", line: "#2b2f35", ink: "#eef0f3", grey: "#3d434b" };
  const signal = "#0a7268";
  if (kind === "system") {
    return (
      <span aria-hidden className="grid h-16 grid-cols-2 overflow-hidden rounded-md border">
        <MiniScreen c={light} signal={signal} />
        <MiniScreen c={dark} signal="#45c2b4" />
      </span>
    );
  }
  if (kind === "glass") {
    return (
      <span
        aria-hidden
        className="relative h-16 overflow-hidden rounded-md border"
        style={{
          backgroundColor: "#e9edf2",
          // taste-skill-ignore: a miniature of the Liquid Glass ground, shown only on its own picker tile
          backgroundImage:
            "radial-gradient(70% 90% at 15% 0%, rgb(10 114 104 / .28), transparent 70%), radial-gradient(70% 90% at 100% 100%, rgb(70 104 160 / .26), transparent 70%)",
        }}
      >
        <span className="absolute inset-x-3 top-2.5 h-3 rounded-full" style={{ background: "#ffffff", opacity: 0.9 }} />
        <span
          className="absolute right-3 bottom-2 left-6 h-7 rounded-md"
          style={{
            background: "rgb(255 255 255 / .55)",
            border: "1px solid rgb(255 255 255 / .8)",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / .9), 0 6px 14px -6px rgb(16 22 32 / .3)",
          }}
        />
      </span>
    );
  }
  return (
    <span aria-hidden className="block h-16 overflow-hidden rounded-md border">
      <MiniScreen c={kind === "dark" ? dark : light} signal={kind === "dark" ? "#45c2b4" : signal} />
    </span>
  );
}

function MiniScreen({ c, signal }: { c: Record<string, string>; signal: string }) {
  return (
    <span className="flex h-full" style={{ background: c.ground }}>
      <span className="w-[22%] border-r" style={{ borderColor: c.line }} />
      <span className="flex flex-1 flex-col gap-1 p-1.5">
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: c.ink }} />
        <span className="flex flex-1 flex-col justify-center gap-1 rounded-sm border px-1" style={{ background: c.sheet, borderColor: c.line }}>
          <span className="relative h-px w-full" style={{ background: c.grey }}>
            <span className="absolute -top-0.5 left-[35%] size-1.5 rounded-full" style={{ background: signal }} />
          </span>
          <span className="h-1 w-2/3 rounded-full" style={{ background: c.grey }} />
        </span>
      </span>
    </span>
  );
}
