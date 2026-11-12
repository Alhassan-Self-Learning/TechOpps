"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { ApiError, apiRequest, type SourceKind, type SourceOut } from "@/lib/api";

const KIND_HELP: Record<SourceKind, string> = {
  rss: "An RSS feed URL. The most reliable option when a site offers one.",
  atom: "An Atom feed URL.",
  api: "An official JSON API endpoint. Set items_path and field names in the config below.",
  web_page:
    "A page that lists opportunities. Only use pages whose terms allow automated reading; you must note the permission basis before activating.",
  manual: "No fetching. Paste opportunity text yourself and it is processed like collected items.",
};

const CONFIG_EXAMPLE: Partial<Record<SourceKind, string>> = {
  api: JSON.stringify(
    { items_path: "data.items", fields: { id: "id", title: "title", url: "url", published: "published_at" } },
    null,
    2,
  ),
  web_page: JSON.stringify({ item_selector: ".event-card", title_selector: "h3", link_selector: "a[href]" }, null, 2),
};

const INTERVALS = [
  { value: 60, label: "Every hour" },
  { value: 360, label: "Every 6 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Daily" },
  { value: 10080, label: "Weekly" },
];

export function SourceForm({ existing }: { existing?: SourceOut }) {
  const router = useRouter();
  const [kind, setKind] = useState<SourceKind>(existing?.kind ?? "rss");
  const [name, setName] = useState(existing?.name ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [interval, setInterval] = useState(existing?.fetch_interval_minutes ?? 720);
  const [notes, setNotes] = useState(existing?.access_notes ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [config, setConfig] = useState(
    existing && Object.keys(existing.config).length ? JSON.stringify(existing.config, null, 2) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const showConfig = kind === "api" || kind === "web_page";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    let parsedConfig: Record<string, unknown> = {};
    if (showConfig && config.trim()) {
      try {
        parsedConfig = JSON.parse(config);
      } catch {
        setError("Config must be valid JSON.");
        return;
      }
    }
    const body = {
      name,
      url: kind === "manual" && !url.trim() ? null : url.trim(),
      description: description.trim() || null,
      config: parsedConfig,
      fetch_interval_minutes: interval,
      access_notes: notes.trim() || null,
    };
    setBusy(true);
    try {
      if (existing) {
        await apiRequest(`/api/v1/sources/${existing.id}`, { method: "PATCH", body });
        setSaved("Changes saved.");
        router.refresh();
      } else {
        const created = await apiRequest<SourceOut>("/api/v1/sources", {
          method: "POST",
          body: { ...body, kind },
        });
        router.push(`/sources/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the source.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!existing && (
        <Field id="kind" label="Type" hint={KIND_HELP[kind]}>
          <Select id="kind" aria-describedby="kind-hint" value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
            <option value="rss">RSS feed</option>
            <option value="atom">Atom feed</option>
            <option value="api">JSON API</option>
            <option value="web_page">Web page</option>
            <option value="manual">Manual entry</option>
          </Select>
        </Field>
      )}
      <Field id="name" label="Name">
        <Input id="name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id="url" label="URL" optional={kind === "manual"}>
        <Input
          id="url"
          type="url"
          inputMode="url"
          required={kind !== "manual"}
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      {kind !== "manual" && (
        <Field id="interval" label="Check for new items">
          <Select id="interval" value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field
        id="notes"
        label={
          <>
            Permission and terms notes
            {kind === "web_page" && <span className="font-normal text-muted-foreground"> (required to activate)</span>}
          </>
        }
      >
        <Textarea
          id="notes"
          rows={2}
          maxLength={2000}
          placeholder="e.g. Official feed published for subscribers; site terms allow personal use."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <Field id="description" label="Description" optional>
        <Input id="description" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {showConfig && (
        <div>
          <Field id="config" label="Config (JSON)">
            <Textarea
              id="config"
              rows={6}
              spellCheck={false}
              placeholder={CONFIG_EXAMPLE[kind]}
              className="font-mono text-xs"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
          </Field>
          {kind === "api" && (
            <p className="mt-1 text-xs text-muted-foreground">
              For APIs that need a token, set <code>auth_env</code> to the name of an environment variable starting
              with <code>TECHOPPS_SOURCE_</code>. Never paste the token itself here.
            </p>
          )}
        </div>
      )}
      <FormMessage message={error ? { ok: false, text: error } : saved ? { ok: true, text: saved } : null} />
      <div>
        <Button type="submit" disabled={busy}>
          {existing ? "Save changes" : "Add source"}
        </Button>
        {!existing && (
          <p className="mt-2 text-xs text-muted-foreground">
            New sources start inactive. Nothing is collected until you activate it.
          </p>
        )}
      </div>
    </form>
  );
}
