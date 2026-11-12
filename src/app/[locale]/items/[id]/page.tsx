import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ItemHeader } from "@/features/items/components/item-header";
import { ItemSourceList } from "@/features/items/components/item-source-list";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import type { Recipe } from "@/features/recipes/domain/recipe";
import { toRecipeView } from "@/features/recipes/domain/recipe-view";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import {
  itemRepository,
  itemSourceRepository,
  recipeRepository,
  stationRepository,
} from "../../data";
import { assertLocale } from "../../resolve-locale";

export async function generateStaticParams() {
  const items = await itemRepository.getAll();
  return LOCALES.flatMap((locale) => items.map((item) => ({ locale, id: item.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/items/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const item = await itemRepository.getById(id);
  if (!item) notFound();

  return {
    title: item.name[locale],
    description: item.description?.[locale] ?? getMessages(locale).app.description,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function ItemPage({ params }: PageProps<"/[locale]/items/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { items: text, recipes: recipeLabels } = getMessages(locale);

  const item = await itemRepository.getById(id);
  if (!item) notFound();

  const [items, stations, producing, consuming, sources] = await Promise.all([
    itemRepository.getAll(),
    stationRepository.getAll(),
    recipeRepository.findByOutput(id),
    recipeRepository.findByInput(id),
    itemSourceRepository.findByItem(id),
  ]);

  const itemNames = new Map(items.map((entry) => [entry.id, entry.name[locale]]));
  const stationNames = new Map(stations.map((station) => [station.id, station.name[locale]]));
  const names = {
    itemName: (itemId: string) => itemNames.get(itemId) ?? itemId,
    stationName: (stationId: string) => stationNames.get(stationId) ?? stationId,
  };
  const toViews = (recipes: readonly Recipe[]) =>
    recipes.map((recipe) => toRecipeView(recipe, names));

  const renderRecipes = (recipes: readonly Recipe[]) => (
    <RecipeList
      recipes={toViews(recipes)}
      locale={locale}
      labels={recipeLabels}
      itemHref={(itemId) => localizedPath(locale, `/items/${itemId}`)}
      currentItemId={id}
    />
  );

  const isCraftable = producing.length > 0;
  const hasSources = sources.length > 0;

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, "/items")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {text.detail.back}
      </Link>

      <ItemHeader item={item} locale={locale} labels={text} />

      {/* Craftable items show how to make them; raw items show where to find them; both can apply. */}
      {isCraftable && <Section title={text.detail.obtain}>{renderRecipes(producing)}</Section>}

      {hasSources && (
        <Section title={text.detail.whereToFind}>
          <ItemSourceList sources={sources} locale={locale} labels={text.sources} />
        </Section>
      )}

      {!isCraftable && !hasSources && (
        <Section title={text.detail.whereToFind}>
          <p className="text-muted">{text.detail.noOrigin}</p>
        </Section>
      )}

      <Section title={text.detail.usedIn}>
        {consuming.length > 0 ? (
          renderRecipes(consuming)
        ) : (
          <p className="text-muted">{text.detail.noUsage}</p>
        )}
      </Section>
    </article>
  );
}
