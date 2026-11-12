"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import { formatTemplate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { SearchField } from "@/shared/ui/search-field";
import { Select } from "@/shared/ui/select";
import {
  type ExplorerState,
  isDefaultState,
  parseExplorerState,
  serializeExplorerState,
  DEFAULT_EXPLORER_STATE,
} from "../domain/explorer-state";
import {
  collectTags,
  filterItems,
  type ItemListEntry,
  SORT_KEYS,
  type SortKey,
  sortItems,
} from "../domain/item-list";
import { ItemCard, type ItemCardLabels } from "./item-card";

export interface ItemExplorerLabels extends ItemCardLabels {
  search: string;
  searchPlaceholder: string;
  category: string;
  allCategories: string;
  sort: string;
  sortOptions: Readonly<Record<SortKey, string>>;
  showUnavailable: string;
  clear: string;
  resultsOne: string;
  resultsOther: string;
  empty: string;
}

interface ItemExplorerProps {
  entries: readonly ItemListEntry[];
  locale: Locale;
  labels: ItemExplorerLabels;
}

export function ItemExplorer({ entries, locale, labels }: ItemExplorerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ExplorerState>(() => parseExplorerState(searchParams));

  const hasUnavailable = useMemo(() => entries.some((entry) => entry.unavailable), [entries]);
  const availableTags = useMemo(
    () => collectTags(entries, state.showUnavailable),
    [entries, state.showUnavailable],
  );
  // A tag from the URL (or hidden by the availability toggle) that no longer exists is ignored.
  const activeTag = state.tag !== null && availableTags.includes(state.tag) ? state.tag : null;

  const results = useMemo(
    () =>
      sortItems(
        filterItems(entries, {
          query: state.query,
          tag: activeTag,
          showUnavailable: state.showUnavailable,
        }),
        state.sort,
        locale,
      ),
    [entries, state.query, activeTag, state.showUnavailable, state.sort, locale],
  );

  function update(patch: Partial<ExplorerState>) {
    const next = { ...state, ...patch };
    setState(next);
    const query = serializeExplorerState(next);
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  const count = results.length === 1 ? labels.resultsOne : labels.resultsOther;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <SearchField
          id="item-filter"
          label={labels.search}
          showLabel
          className="sm:col-span-2 lg:col-span-1"
          placeholder={labels.searchPlaceholder}
          value={state.query}
          onChange={(event) => update({ query: event.target.value })}
          onSubmit={(event) => event.preventDefault()}
          autoComplete="off"
          maxLength={100}
        />

        <Select
          id="item-category"
          label={labels.category}
          value={activeTag ?? ""}
          onChange={(event) => update({ tag: event.target.value || null })}
        >
          <option value="">{labels.allCategories}</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {labels.tags[tag] ?? tag}
            </option>
          ))}
        </Select>

        <Select
          id="item-sort"
          label={labels.sort}
          value={state.sort}
          onChange={(event) => update({ sort: event.target.value as SortKey })}
        >
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {labels.sortOptions[key]}
            </option>
          ))}
        </Select>
      </div>

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
          {!isDefaultState(state) && (
            <Button variant="ghost" size="sm" onClick={() => update({ ...DEFAULT_EXPLORER_STATE })}>
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
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((entry) => (
            <li key={entry.id}>
              <ItemCard
                entry={entry}
                href={localizedPath(locale, `/items/${entry.id}`)}
                locale={locale}
                labels={labels}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
