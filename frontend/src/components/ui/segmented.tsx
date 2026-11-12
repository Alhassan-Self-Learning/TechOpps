"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

/**
 * A row of mutually exclusive options. Built on native radio inputs, so arrow keys move the
 * selection and screen readers announce "1 of 4". As wide as its options, never stretched,
 * unless `stretch` is set (phone sheets).
 */
export function Segmented<T extends string>({
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
  size = "default",
  stretch = false,
  className,
}: {
  legend: string;
  hideLegend?: boolean;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "default" | "sm";
  stretch?: boolean;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className={cn(hideLegend ? "sr-only" : "mb-1.5 text-sm font-medium")}>{legend}</legend>
      <div
        className={cn(
          "inline-flex max-w-full gap-0.5 overflow-x-auto rounded-md bg-surface-2 p-0.5",
          stretch && "flex w-full",
        )}
      >
        {options.map((o) => {
          const Icon = o.icon;
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-sm whitespace-nowrap select-none",
                "transition-[background-color,color,box-shadow] duration-[var(--dur-1)]",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring",
                size === "sm" ? "h-7" : "h-8",
                stretch && "flex-1",
                checked
                  ? "bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {Icon && <Icon className="size-4" aria-hidden />}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
