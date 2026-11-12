import type { ReactNode } from "react";

export interface Fact {
  label: string;
  value: ReactNode;
}

/** Label/value pairs as a description list: facts about one thing, readable by screen readers. */
export function FactList({ facts }: { facts: readonly Fact[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {facts.map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-1 font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
