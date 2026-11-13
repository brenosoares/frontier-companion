import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { QUALITIES } from "@/features/plants/domain/plant";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { toRecipeView } from "@/features/recipes/domain/recipe-view";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber } from "@/shared/lib/format";
import { ItemLine } from "@/shared/ui/item-line";
import { itemRepository, plantRepository, recipeRepository, stationRepository } from "../../data";
import { recipeNames } from "../../recipe-names";
import { resolveLocale } from "../../resolve-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plants/fertilizing">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).plants.fertilizing.title };
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted">{intro}</p>
      </div>
      {children}
    </section>
  );
}

export default async function FertilizingPage({
  params,
}: PageProps<"/[locale]/plants/fertilizing">) {
  const locale = await resolveLocale(params);
  const { plants: plantText, recipes: recipeLabels } = getMessages(locale);
  const text = plantText.fertilizing;

  const [items, stations, effects, rates] = await Promise.all([
    itemRepository.getAll(),
    stationRepository.getAll(),
    plantRepository.getEffects(),
    plantRepository.getQualityRates(),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const names = recipeNames(items, stations, locale);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });

  const itemLink = (itemId: string) => {
    const item = itemById.get(itemId);
    return (
      <ItemLine icon={item?.icon ?? null}>
        <Link href={localizedPath(locale, `/items/${itemId}`)} className={LINK_CLASS}>
          {item?.name[locale] ?? itemId}
        </Link>
      </ItemLine>
    );
  };

  const withTag = (tag: string) =>
    items
      .filter((item) => item.tags.includes(tag))
      .sort((a, b) => collator.compare(a.name[locale], b.name[locale]));

  const recipesOf = async (itemId: string) =>
    (await recipeRepository.findByOutput(itemId)).map((recipe) => toRecipeView(recipe, names));
  const fertilizers = await Promise.all(
    [
      { heading: null, list: withTag("Fertilizer") },
      { heading: text.fertilizers.powders, list: withTag("Powder") },
    ].map(async ({ heading, list }) => ({
      heading,
      entries: await Promise.all(
        list.map(async (item) => ({ item, recipes: await recipesOf(item.id) })),
      ),
    })),
  );

  const percent = (value: number) =>
    new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
      value / 100,
    );

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <Link
        href={localizedPath(locale, "/plants")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {text.back}
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{text.intro}</p>
      </header>

      <Section title={text.fertilizers.title} intro={text.fertilizers.intro}>
        {fertilizers.map(({ heading, entries }) => (
          <div key={heading ?? "fertilizers"} className="flex flex-col gap-4">
            {heading && <h3 className="text-lg font-semibold">{heading}</h3>}
            <ul className="flex flex-col gap-4">
              {entries.map(({ item, recipes }) => (
                <li key={item.id} className="flex flex-col gap-2">
                  <p className="text-lg font-medium">{itemLink(item.id)}</p>
                  {recipes.length > 0 && (
                    <RecipeList
                      recipes={recipes}
                      locale={locale}
                      labels={recipeLabels}
                      itemHref={(id) => localizedPath(locale, `/items/${id}`)}
                      currentItemId={item.id}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title={text.reagents.title} intro={text.reagents.intro}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {effects.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3"
            >
              {itemLink(entry.id)}
              <p className="text-sm text-muted">
                {text.reagents.effect}: {text.reagents.effects[entry.effect]}
                {entry.potency > 0 &&
                  ` · ${text.reagents.potency}: ${formatNumber(entry.potency, locale)}`}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={text.quality.title} intro={text.quality.intro}>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-md text-left text-sm">
            <caption className="sr-only">{text.quality.title}</caption>
            <thead className="bg-surface-hover">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  {text.quality.level}
                </th>
                {QUALITIES.map((quality) => (
                  <th key={quality} scope="col" className="p-3 font-semibold">
                    {text.quality.qualities[quality]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-t border-border">
                  <th scope="row" className="p-3 font-medium">
                    {rate.level > 0 ? `+${rate.level}` : rate.level}
                  </th>
                  {QUALITIES.map((quality) => (
                    <td key={quality} className="p-3">
                      {rate.rates[quality] > 0 ? percent(rate.rates[quality]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">{text.quality.note}</p>
      </Section>
    </div>
  );
}
