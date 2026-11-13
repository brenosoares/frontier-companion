import { ArrowLeft, Calculator } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { constructGroup } from "@/features/constructs/domain/construct";
import { partGroup } from "@/features/mech/domain/mech";
import { formatNumber } from "@/shared/lib/format";
import { FactList } from "@/shared/ui/fact-list";
import { GameIcon, type GameIconKind } from "@/shared/ui/game-icon";
import { ItemHeader } from "@/features/items/components/item-header";
import { ItemSourceList } from "@/features/items/components/item-source-list";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import type { Recipe } from "@/features/recipes/domain/recipe";
import { toRecipeView } from "@/features/recipes/domain/recipe-view";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import {
  constructRepository,
  itemRepository,
  itemSourceRepository,
  mechRepository,
  plantRepository,
  recipeRepository,
  stationRepository,
} from "../../data";
import { recipeNames } from "../../recipe-names";
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

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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
  const {
    items: text,
    recipes: recipeLabels,
    mech: mechText,
    recipesHub,
    plants: plantText,
  } = getMessages(locale);

  const item = await itemRepository.getById(id);
  if (!item) notFound();

  const [
    items,
    stations,
    producing,
    consuming,
    sources,
    mechParts,
    mechChips,
    constructs,
    plants,
    effect,
  ] = await Promise.all([
    itemRepository.getAll(),
    stationRepository.getAll(),
    recipeRepository.findByOutput(id),
    recipeRepository.findByInput(id),
    itemSourceRepository.findByItem(id),
    mechRepository.getParts(),
    mechRepository.getChips(),
    constructRepository.getAll(),
    plantRepository.getAll(),
    plantRepository.getEffectOf(id),
  ]);

  const names = recipeNames(items, stations, locale);
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

  const costOf = (costs: readonly { itemId: string; amount: number }[]) =>
    costs.find((cost) => cost.itemId === id)?.amount;
  const constructUses = constructs.flatMap((construct) => {
    const amount = costOf(construct.costs);
    return amount === undefined
      ? []
      : [
          {
            key: construct.id,
            amount,
            name: construct.name[locale],
            icon: construct.icon,
            href: localizedPath(locale, `/constructs/${construct.id}`),
            context: `${recipesHub.groups[constructGroup(construct.category)]} · ${recipesHub.categories[construct.category]}`,
          },
        ];
  });
  const mechUses = {
    parts: mechParts.flatMap((part) => {
      const amount = costOf(part.costs);
      return amount === undefined
        ? []
        : [
            {
              key: part.id,
              amount,
              name: part.name[locale],
              icon: part.icon,
              href: localizedPath(locale, `/mech/${part.id}`),
              context: `${mechText.groups[partGroup(part.category)]} · ${mechText.categories[part.category]}`,
            },
          ];
    }),
    chips: mechChips.flatMap((chip) => {
      const amount = costOf(chip.costs);
      return amount === undefined
        ? []
        : [
            {
              key: chip.id,
              amount,
              name: chip.name[locale],
              icon: chip.icon,
              href: localizedPath(locale, `/mech/chip/${chip.id}`),
              context: chip.fits.map((category) => mechText.categories[category]).join(", "),
            },
          ];
    }),
  };
  const renderUses = (title: string, uses: typeof constructUses, kind: GameIconKind) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {uses.map((use) => (
          <li
            key={use.key}
            className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3"
          >
            <span className="inline-flex items-center gap-2">
              <GameIcon kind={kind} icon={use.icon} size={28} className="size-9" />
              <span className="min-w-0 break-words">
                <span className="font-semibold">{formatNumber(use.amount, locale)}×</span>{" "}
                <Link
                  href={use.href}
                  className="rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {use.name}
                </Link>
              </span>
            </span>
            {use.context && <span className="text-sm text-muted">{use.context}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
  const hasOtherUses =
    constructUses.length > 0 || mechUses.parts.length > 0 || mechUses.chips.length > 0;

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

      {isCraftable && (
        <Button asChild variant="secondary" className="self-start">
          <Link href={`${localizedPath(locale, "/calculator")}?item=${id}`}>
            <Calculator aria-hidden="true" className="size-4" />
            {text.detail.calculate}
          </Link>
        </Button>
      )}

      {/* Craftable items show how to make them; raw items show where to find them; both can apply. */}
      {isCraftable && <Section title={text.detail.obtain}>{renderRecipes(producing)}</Section>}

      {hasSources && (
        <Section title={text.detail.whereToFind}>
          <ItemSourceList
            sources={sources}
            locale={locale}
            labels={text.sources}
            plantIds={plants.map((plant) => plant.id)}
          />
        </Section>
      )}

      {!isCraftable && !hasSources && (
        <Section title={text.detail.whereToFind}>
          <p className="text-muted">{text.detail.noOrigin}</p>
        </Section>
      )}

      {effect && (
        <Section title={text.detail.reagent.title}>
          <FactList
            facts={[
              {
                label: text.detail.reagent.effect,
                value: plantText.fertilizing.reagents.effects[effect.effect],
              },
              ...(effect.potency > 0
                ? [
                    {
                      label: text.detail.reagent.potency,
                      value: formatNumber(effect.potency, locale),
                    },
                  ]
                : []),
            ]}
          />
          <p className="text-sm">
            <Link href={localizedPath(locale, "/plants/fertilizing")} className={LINK_CLASS}>
              {plantText.fertilizing.link}
            </Link>
          </p>
        </Section>
      )}

      <Section title={text.detail.usedIn}>
        {consuming.length > 0 && renderRecipes(consuming)}
        {constructUses.length > 0 &&
          renderUses(text.detail.usedInConstructs, constructUses, "construct")}
        {mechUses.parts.length > 0 &&
          renderUses(text.detail.usedInMechParts, mechUses.parts, "mech")}
        {mechUses.chips.length > 0 &&
          renderUses(text.detail.usedInMechChips, mechUses.chips, "mech")}
        {consuming.length === 0 && !hasOtherUses && (
          <p className="text-muted">{text.detail.noUsage}</p>
        )}
      </Section>
    </article>
  );
}
