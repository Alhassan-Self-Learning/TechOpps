import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  HandHeart,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, SUBTYPE_LABEL } from "@/lib/categories";
import { label } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One grey outline glyph per category. Category is never encoded by colour. */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  course: BookOpen,
  workshop: Wrench,
  bootcamp_program: GraduationCap,
  volunteering: HandHeart,
  experience: Briefcase,
  competition: Trophy,
  event: CalendarDays,
  scholarship: Award,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICON[category] ?? BookOpen;
  return <Icon aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground", className)} />;
}

/** "Competition · CTF" with its glyph, in 12px grey. */
export function CategoryBadge({
  category,
  subtype,
  className,
}: {
  category: string;
  subtype?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <CategoryIcon category={category} />
      <span className="truncate">
        <span className="font-medium text-foreground/80">{CATEGORY_LABEL[category] ?? label(category)}</span>
        {subtype && <> · {SUBTYPE_LABEL[subtype] ?? label(subtype)}</>}
      </span>
    </span>
  );
}

export function SampleBadge() {
  return (
    <Badge tone="outline" title="Fictional sample data for testing the interface. Not a real opportunity.">
      Sample
    </Badge>
  );
}

export function ReviewBadge() {
  return (
    <Badge tone="urgent" title="Some details were uncertain when extracted. Check the original listing.">
      Needs review
    </Badge>
  );
}
