import { Search } from "lucide-react";
import type { ComponentProps, FormEventHandler } from "react";
import { cn } from "@/shared/lib/cn";

export type SearchFieldProps = Omit<ComponentProps<"input">, "type"> & {
  /** Accessible name (also the search landmark's name). */
  label: string;
  /** Show the label above the field instead of only exposing it to assistive technology. */
  showLabel?: boolean;
  /** Where the form submits (GET, `?q=`). Without it the field only filters in place. */
  action?: string;
  /** Lets a client component handle submission itself (e.g. prevent a page reload). */
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function SearchField({
  label,
  showLabel = false,
  className,
  action,
  onSubmit,
  id = "search",
  name = "q",
  ...props
}: SearchFieldProps) {
  return (
    <form
      role="search"
      aria-label={label}
      method="get"
      {...(action && { action })}
      {...(onSubmit && { onSubmit })}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      <label htmlFor={id} className={showLabel ? "text-sm font-medium text-muted" : "sr-only"}>
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          id={id}
          name={name}
          type="search"
          className="h-10 w-full rounded-lg border border-border-strong bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
          {...props}
        />
      </div>
    </form>
  );
}
