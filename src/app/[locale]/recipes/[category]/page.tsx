import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, DEFAULT_LOCALE, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import type { Messages } from "@/shared/i18n/messages/types";
import { CardExplorer, type CardExplorerLabels } from "@/shared/ui/card-explorer";
import { assertLocale } from "../../resolve-locale";
import { loadRecipeCatalog } from "../recipe-catalog";

function toExplorerLabels({ recipesHub, items }: Messages): CardExplorerLabels {
  return {
    search: recipesHub.filters.search,
    searchPlaceholder: recipesHub.filters.searchPlaceholder,
    showUnavailable: recipesHub.filters.showUnavailable,
    clear: recipesHub.filters.clear,
    resultsOne: recipesHub.itemCount.one,
    resultsOther: recipesHub.itemCount.other,
    empty: recipesHub.empty,
    showMore: recipesHub.showMore,
    cost: recipesHub.cards.cost,
    madeIn: recipesHub.cards.madeIn,
    yields: recipesHub.cards.yields,
    unavailable: items.unavailableBadge,
  };
}

export async function generateStaticParams() {
  const { categories } = await loadRecipeCatalog(DEFAULT_LOCALE);
  return LOCALES.flatMap((locale) => categories.map(({ id }) => ({ locale, category: id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/recipes/[category]">): Promise<Metadata> {
  const { locale: rawLocale, category } = await params;
  const locale = assertLocale(rawLocale);
  const summary = (await loadRecipeCatalog(locale)).categories.find((c) => c.id === category);
  if (!summary) notFound();
  return { title: summary.label };
}

export default async function RecipeCategoryPage({
  params,
}: PageProps<"/[locale]/recipes/[category]">) {
  const { locale: rawLocale, category } = await params;
  const locale = assertLocale(rawLocale);
  const messages = getMessages(locale);

  const catalog = await loadRecipeCatalog(locale);
  const summary = catalog.categories.find((c) => c.id === category);
  const entries = catalog.entries.get(category);
  if (!summary || !entries) notFound();

  const groupLabel =
    summary.group === "craft"
      ? messages.recipesHub.craft.title
      : messages.recipesHub.groups[summary.group];

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <Link
        href={localizedPath(locale, "/recipes")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {messages.recipesHub.back}
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted">{groupLabel}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{summary.label}</h1>
      </header>

      {/* useSearchParams needs a Suspense boundary so the rest of the page stays static. */}
      <Suspense fallback={<p className="text-muted">{messages.recipesHub.loading}</p>}>
        <CardExplorer entries={entries} locale={locale} labels={toExplorerLabels(messages)} />
      </Suspense>
    </div>
  );
}
