import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type SelectProps = ComponentProps<"select"> & {
  /** Visible label; always rendered so the control has an accessible name. */
  label: string;
};

/** Native <select> (best accessibility and mobile UX) with the design-system look. */
export function Select({ label, className, id, children, ...props }: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="h-10 w-full appearance-none rounded-lg border border-border-strong bg-background pr-9 pl-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}
