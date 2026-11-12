"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/field";

/** A select whose value is one URL parameter (e.g. sort order), so the view is bookmarkable. */
export function UrlSelect({
  name,
  label,
  options,
  className,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`url-${name}`} className="text-sm text-muted-foreground">
        {label}
      </label>
      <Select
        id={`url-${name}`}
        wrapperClassName={className ?? "w-44"}
        className="h-8"
        disabled={pending}
        value={params.get(name) ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set(name, e.target.value);
          else next.delete(name);
          const s = next.toString();
          startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
