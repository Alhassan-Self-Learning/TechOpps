import { cn } from "@/lib/utils";

/**
 * The title row of every screen: a noun as the h1 (24px), one grey line about the data (the
 * finding, the scope), and real actions on the right. Never a greeting, never instructions.
 */
export function PageHeader({
  title,
  description,
  actions,
  above,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  above?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 max-w-3xl">
        {above}
        <h1 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.01em] text-balance md:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Max-width frame shared by every page so the left edge and the measure hold across screens. */
export function PageFrame({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[72rem]", className)} {...props} />;
}
