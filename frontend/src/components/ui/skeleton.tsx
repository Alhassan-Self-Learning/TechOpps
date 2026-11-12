import { cn } from "@/lib/utils";

/** A flat grey block at the size of what will replace it. No shimmer. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("rounded-md bg-surface-2", className)} {...props} />;
}
