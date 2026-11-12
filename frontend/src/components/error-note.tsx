import { CircleAlert } from "lucide-react";

/** A failure stays inside the block that failed: what failed, why, and what to try. */
export function ErrorNote({ title, message }: { title: string; message: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border bg-surface px-5 py-4">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
