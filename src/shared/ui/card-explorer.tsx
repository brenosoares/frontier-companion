"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatTemplate } from "@/shared/lib/format";
import { matchesAllWords } from "@/shared/lib/text";
import { Button } from "./button";
import { CraftCard, type CraftCardEntry, type CraftCardLabels } from "./craft-card";
import { SearchField } from "./search-field";

/** Only plain strings cross the server -> client boundary. */
export interface CardExplorerLabels extends CraftCardLabels {
  search: string;
  searchPlaceholder: string;
  showUnavailable: string;
  clear: string;
  resultsOne: string;
  resultsOther: string;
  empty: string;
  showMore: string;
}

interface CardExplorerProps {
  /** Already sorted. */
  entries: readonly CraftCardEntry[];
  locale: string;
  labels: CardExplorerLabels;
}

const PAGE_SIZE = 40;
const MAX_QUERY_LENGTH = 100;

interface State {
  query: string;
  showUnavailable: boolean;
}

/** Filterable, paged grid of cards. Its state (`q`, `unavailable`) lives in the URL. */
export function CardExplorer({ entries, locale, labels }: CardExplorerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>(() => ({
    query: (searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    showUnavailable: searchParams.get("unavailable") === "1",
  }));
  const [visible, setVisible] = useState(PAGE_SIZE);

  const hasUnavailable = useMemo(() => entries.some((entry) => entry.unavailable), [entries]);
  const results = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (state.showUnavailable || !entry.unavailable) &&
          matchesAllWords(entry.searchText, state.query),
      ),
    [entries, state.query, state.showUnavailable],
  );

  function update(patch: Partial<State>) {
    const next = { ...state, ...patch };
    setState(next);
    setVisible(PAGE_SIZE);

    const params = new URLSearchParams();
    if (next.query) params.set("q", next.query);
    if (next.showUnavailable) params.set("unavailable", "1");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;
  const hasFilters = state.query !== "" || state.showUnavailable;
  const count = results.length === 1 ? labels.resultsOne : labels.resultsOther;

  return (
    <div className="flex flex-col gap-6">
      <SearchField
        id="card-filter"
        label={labels.search}
        showLabel
        className="max-w-xl"
        placeholder={labels.searchPlaceholder}
        value={state.query}
        onChange={(event) => update({ query: event.target.value })}
        onSubmit={(event) => event.preventDefault()}
        autoComplete="off"
        maxLength={MAX_QUERY_LENGTH}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {hasUnavailable ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.showUnavailable}
              onChange={(event) => update({ showUnavailable: event.target.checked })}
              className="size-4 accent-primary"
            />
            {labels.showUnavailable}
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <p role="status" className="text-sm text-muted">
            {formatTemplate(count, { count: results.length })}
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update({ query: "", showUnavailable: false })}
            >
              {labels.clear}
            </Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-muted">
          {labels.empty}
        </p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((entry) => (
              <li key={entry.id}>
                <CraftCard entry={entry} locale={locale} labels={labels} />
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => setVisible((current) => current + PAGE_SIZE)}
            >
              {formatTemplate(labels.showMore, { count: remaining })}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
