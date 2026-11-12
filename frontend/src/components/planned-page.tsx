import { EmptyState } from "@/components/empty-state";

/** Placeholder for a section that is designed but not built yet. Says so plainly. */
export function PlannedPage({
  title,
  intro,
  phase,
  what,
}: {
  title: string;
  intro: string;
  phase: number;
  what: string;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted-foreground">{intro}</p>
      <div className="mt-8">
        <EmptyState title={`Not built yet — planned for phase ${phase}`} body={what} />
      </div>
    </div>
  );
}
