import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type SearchFieldProps = Omit<ComponentProps<"input">, "type"> & {
  /** Accessible name; rendered visually hidden. */
  label: string;
};

export function SearchField({ label, className, id = "search", ...props }: SearchFieldProps) {
  return (
    <form role="search" className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        className="h-10 w-full rounded-lg border border-border-strong bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
    </form>
  );
}
