import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { PlantDrop } from "@/features/plants/domain/plant";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { FactList } from "@/shared/ui/fact-list";
import { GameIcon } from "@/shared/ui/game-icon";
import { ItemLine } from "@/shared/ui/item-line";
import { RecipeList } from "@/features/recipes/components/recipe-list";
import { toRecipeView } from "@/features/recipes/domain/recipe-view";
import { itemRepository, plantRepository, recipeRepository, stationRepository } from "../../data";
import { recipeNames } from "../../recipe-names";
import { assertLocale } from "../../resolve-locale";

export async function generateStaticParams() {
  const plants = await plantRepository.getAll();
  return LOCALES.flatMap((locale) => plants.map((plant) => ({ locale, id: plant.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plants/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const plant = await plantRepository.getById(id);
  if (!plant) notFound();
  return { title: plant.name[locale] };
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

export default async function PlantPage({ params }: PageProps<"/[locale]/plants/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { plants: text, recipes: recipeLabels } = getMessages(locale);

  const plant = await plantRepository.getById(id);
  if (!plant) notFound();
  const [items, stations, plants] = await Promise.all([
    itemRepository.getAll(),
    stationRepository.getAll(),
    plantRepository.getAll(),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const names = recipeNames(items, stations, locale);

  // What this plant gives, other than its own seed. Items other plants give too (Plant Fiber) are
  // only linked: their recipes belong to the item page, not to every plant.
  const harvestIds = [
    ...new Set([...plant.drops, ...(plant.fruit?.drops ?? [])].map((drop) => drop.itemId)),
  ].filter((itemId) => itemId !== plant.seedItemId);
  const givenByOthers = (itemId: string) =>
    plants.some(
      (other) =>
        other.id !== plant.id &&
        [...other.drops, ...(other.fruit?.drops ?? [])].some((drop) => drop.itemId === itemId),
    );
  const ownIds = harvestIds.filter((itemId) => !givenByOthers(itemId));
  const sharedIds = harvestIds.filter(givenByOthers);
  const uses = await Promise.all(
    ownIds.map(async (itemId) => ({
      itemId,
      recipes: (await recipeRepository.findByInput(itemId)).map((recipe) =>
        toRecipeView(recipe, names),
      ),
    })),
  );
  const withUses = uses.filter(({ recipes }) => recipes.length > 0);

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

  const days = (count: number) =>
    formatTemplate(count === 1 ? text.days.one : text.days.other, {
      count: formatNumber(count, locale),
    });

  const percent = (value: number) =>
    new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
      value / 100,
    );

  const dropList = (drops: readonly PlantDrop[]) => (
    <ul className="grid gap-3 sm:grid-cols-2">
      {drops.map((drop) => (
        <li
          key={drop.itemId}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
        >
          {itemLink(drop.itemId)}
          <div className="flex flex-wrap gap-1.5">
            <Badge>
              {drop.minAmount === drop.maxAmount
                ? `${formatNumber(drop.minAmount, locale)}×`
                : `${formatNumber(drop.minAmount, locale)}–${formatNumber(drop.maxAmount, locale)}×`}
            </Badge>
            <Badge>{formatTemplate(text.chance, { chance: percent(drop.chance) })}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );

  const cultivation = [
    ...(plant.cropType
      ? [{ label: text.cultivation.type, value: text.types[plant.cropType] }]
      : []),
    { label: text.cultivation.mature, value: days(plant.daysToMature) },
    { label: text.cultivation.dry, value: days(plant.daysToDry) },
    ...(plant.breakingLevel !== null
      ? [{ label: text.cultivation.breaking, value: formatNumber(plant.breakingLevel, locale) }]
      : []),
  ];

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, "/plants")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {text.back}
      </Link>

      <header className="flex items-center gap-4">
        <GameIcon
          kind="plant"
          icon={plant.icon}
          size={64}
          className="size-20 border border-border"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {plant.name[locale]}
          </h1>
          <Badge className="self-start">{text.groups[plant.kind]}</Badge>
        </div>
      </header>

      <Section title={text.cultivation.title}>
        <FactList facts={cultivation} />
        {plant.kind === "crop" && <p className="text-sm text-muted">{text.cultivation.dryHint}</p>}
      </Section>

      <Section title={text.harvest.title}>
        {plant.drops.length > 0 ? (
          <>
            {dropList(plant.drops)}
            <p className="text-sm text-muted">{text.harvest.hint}</p>
          </>
        ) : (
          <p className="text-muted">{text.harvest.none}</p>
        )}
      </Section>

      {plant.fruit && (
        <Section title={text.fruit.title}>
          <FactList
            facts={[
              { label: text.fruit.daysToGrow, value: days(plant.fruit.daysToGrow) },
              { label: text.fruit.lifetime, value: formatNumber(plant.fruit.maxLifetime, locale) },
            ]}
          />
          {dropList(plant.fruit.drops)}
        </Section>
      )}

      <Section title={text.usedIn.title}>
        {withUses.map(({ itemId, recipes }) => (
          <div key={itemId} className="flex flex-col gap-3">
            <h3 className="text-base font-semibold">
              {itemById.get(itemId)?.name[locale] ?? itemId}
            </h3>
            <RecipeList
              recipes={recipes}
              locale={locale}
              labels={recipeLabels}
              itemHref={(id) => localizedPath(locale, `/items/${id}`)}
              currentItemId={itemId}
            />
          </div>
        ))}
        {withUses.length === 0 && <p className="text-muted">{text.usedIn.none}</p>}
        {sharedIds.length > 0 && (
          <div className="flex flex-col gap-2 text-sm text-muted">
            <p>{text.usedIn.shared}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-base text-foreground">
              {sharedIds.map((itemId) => (
                <li key={itemId}>{itemLink(itemId)}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title={text.seed.title}>
        {plant.seedItemId ? (
          <p className="text-lg">{itemLink(plant.seedItemId)}</p>
        ) : (
          <p className="text-muted">{text.seed.none}</p>
        )}
      </Section>
    </article>
  );
}
