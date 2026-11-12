import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemExplorer, type ItemExplorerLabels } from "@/features/items/components/item-explorer";
import { toListEntry } from "@/features/items/domain/item-list";
import { getMessages } from "@/shared/i18n/get-messages";
import type { Messages } from "@/shared/i18n/messages/types";
import { itemRepository } from "../data";
import { resolveLocale } from "../resolve-locale";

/** Only plain strings can cross the server -> client boundary (no functions). */
function toExplorerLabels({ items }: Messages): ItemExplorerLabels {
  return {
    search: items.filters.search,
    searchPlaceholder: items.filters.searchPlaceholder,
    category: items.filters.category,
    allCategories: items.filters.allCategories,
    sort: items.filters.sort,
    sortOptions: items.sort,
    showUnavailable: items.filters.showUnavailable,
    clear: items.filters.clear,
    resultsOne: items.results.one,
    resultsOther: items.results.other,
    empty: items.empty,
    tags: items.tags,
    sellValue: items.detail.sellValue,
    weight: items.detail.weight,
    unavailable: items.unavailableBadge,
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/items">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).items.title };
}

export default async function ItemsPage({ params }: PageProps<"/[locale]/items">) {
  const locale = await resolveLocale(params);
  const messages = getMessages(locale);
  const entries = (await itemRepository.getAll()).map((item) => toListEntry(item, locale));

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.items.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted">{messages.items.intro}</p>
      </header>

      {/* useSearchParams needs a Suspense boundary so the rest of the page stays static. */}
      <Suspense fallback={<p className="text-muted">{messages.items.loading}</p>}>
        <ItemExplorer entries={entries} locale={locale} labels={toExplorerLabels(messages)} />
      </Suspense>
    </div>
  );
}
