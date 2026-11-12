import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  succeeded: "text-ok",
  partial: "text-urgent",
  failed: "text-danger",
  running: "text-signal",
};
const TEXT: Record<string, string> = {
  succeeded: "Succeeded",
  partial: "Partly succeeded",
  failed: "Failed",
  running: "Running",
};

export function RunStatus({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">Never run</span>;
  return <span className={cn("font-medium", STYLE[status])}>{TEXT[status] ?? status}</span>;
}
