"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { ApiError, apiRequest } from "@/lib/api";

export function ManualItemForm({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest(`/api/v1/sources/${sourceId}/items`, {
        method: "POST",
        body: { title: title.trim() || null, url: url.trim() || null, text },
      });
      setTitle("");
      setUrl("");
      setText("");
      setMessage({ ok: true, text: "Added. It will be processed with the other pending items." });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Could not add the item." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field id="m-title" label="Title" optional>
        <Input id="m-title" maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="m-url" label="Link to the original" optional>
        <Input id="m-url" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <Field id="m-text" label="Opportunity text" hint="Paste the full announcement: what it is, who can apply, dates, location, cost.">
        <Textarea
          id="m-text"
          required
          minLength={20}
          maxLength={50000}
          rows={8}
          aria-describedby="m-text-hint"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <div>
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Adding…" : "Add item"}
        </Button>
      </div>
      <FormMessage message={message ? { ok: message.ok, text: message.text } : null} />
    </form>
  );
}
