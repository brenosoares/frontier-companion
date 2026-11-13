import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/shared/domain/localized-text";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { FactList } from "@/shared/ui/fact-list";
import { GameIcon } from "@/shared/ui/game-icon";
import { ItemLine } from "@/shared/ui/item-line";
import { animalRepository, incubator, itemRepository } from "../../data";
import { assertLocale } from "../../resolve-locale";

export async function generateStaticParams() {
  const animals = await animalRepository.getAll();
  return LOCALES.flatMap((locale) => animals.map((animal) => ({ locale, id: animal.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/animals/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const animal = await animalRepository.getById(id);
  if (!animal) notFound();
  return { title: animal.name[locale] };
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const formatPercent = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value / 100);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function AnimalPage({ params }: PageProps<"/[locale]/animals/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { animals: text } = getMessages(locale);

  const animal = await animalRepository.getById(id);
  if (!animal) notFound();
  const itemById = new Map((await itemRepository.getAll()).map((item) => [item.id, item]));

  const itemLink = (itemId: string, amount?: number) => {
    const item = itemById.get(itemId);
    const label = `${amount === undefined ? "" : `${formatNumber(amount, locale)}× `}${item?.name[locale] ?? itemId}`;
    return (
      <ItemLine icon={item?.icon ?? null}>
        <Link href={localizedPath(locale, `/items/${itemId}`)} className={LINK_CLASS}>
          {label}
        </Link>
      </ItemLine>
    );
  };

  const days = (count: number) =>
    formatTemplate(count === 1 ? text.units.days.one : text.units.days.other, {
      count: formatNumber(count, locale),
    });
  const { ranch, wildFeeding } = animal;
  const lens = incubator.lensChances;

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, "/animals")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {text.back}
      </Link>

      <header className="flex items-center gap-4">
        <GameIcon
          kind="animal"
          icon={animal.icon}
          size={64}
          className="size-20 border border-border"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {animal.name[locale]}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge>{text.diets[animal.diet]}</Badge>
            {!ranch && <Badge tone="blue">{text.wildOnly}</Badge>}
          </div>
        </div>
      </header>

      {ranch && (
        <Section title={text.loot.title}>
          <FactList
            facts={[
              {
                label: text.loot.product,
                value: itemLink(ranch.loot.product.itemId, ranch.loot.product.amount),
              },
              {
                label: text.loot.droppings,
                value: itemLink(ranch.loot.droppings.itemId, ranch.loot.droppings.amount),
              },
            ]}
          />
        </Section>
      )}

      <Section title={text.acquire.title}>
        <FactList
          facts={[
            { label: text.acquire.resource, value: itemLink(wildFeeding.resourceItemId) },
            ...(wildFeeding.egg
              ? [
                  { label: text.acquire.egg, value: itemLink(wildFeeding.egg.itemId) },
                  {
                    label: text.acquire.eggChance,
                    value: formatPercent(wildFeeding.egg.chance, locale),
                  },
                ]
              : []),
          ]}
        />
        {wildFeeding.egg ? (
          <>
            <p className="text-sm text-muted">{text.acquire.hint}</p>
            <h3 className="text-base font-semibold">{text.acquire.lens}</h3>
            <FactList
              facts={[
                { label: text.acquire.lensSmaller, value: formatPercent(lens.smaller, locale) },
                { label: text.acquire.lensLarger, value: formatPercent(lens.larger, locale) },
                { label: text.acquire.lensDouble, value: formatPercent(lens.double, locale) },
                { label: text.acquire.lensRare, value: formatPercent(lens.rare, locale) },
                { label: text.acquire.rareDays, value: days(incubator.rareEggIncubationDays) },
              ]}
            />
            <p className="text-sm text-muted">{text.acquire.lensHint}</p>
          </>
        ) : (
          <p className="text-sm text-muted">{text.acquire.noEgg}</p>
        )}
      </Section>

      <Section title={text.feeding.title}>
        <FactList
          facts={[
            { label: text.feeding.diet, value: text.diets[animal.diet] },
            { label: text.feeding.fodder, value: itemLink(animal.fodderItemId) },
            ...(ranch
              ? [
                  {
                    label: text.feeding.hunger,
                    value: formatTemplate(text.units.fodderPerDay, {
                      count: formatNumber(ranch.needs.dailyHunger, locale),
                    }),
                  },
                  {
                    label: text.feeding.thirst,
                    value: formatTemplate(text.units.waterPerDay, {
                      count: formatNumber(ranch.needs.dailyThirst, locale),
                    }),
                  },
                ]
              : []),
          ]}
        />
        <p className="text-sm text-muted">{text.feeding.fodderHint}</p>
      </Section>

      {ranch ? (
        <Section title={text.breeding.title}>
          <FactList
            facts={[
              { label: text.breeding.incubation, value: days(ranch.lifecycle.incubationDays) },
              { label: text.breeding.growth, value: days(ranch.lifecycle.growthDays) },
              {
                label: text.breeding.space,
                value: formatTemplate(text.units.squareMeters, {
                  count: formatNumber(ranch.needs.minSquareMeters, locale),
                }),
              },
              {
                label: text.breeding.companions,
                value: formatTemplate(
                  ranch.needs.minNearbyAnimals === 1
                    ? text.units.companions.one
                    : text.units.companions.other,
                  { count: formatNumber(ranch.needs.minNearbyAnimals, locale) },
                ),
              },
              { label: text.breeding.sad, value: days(ranch.lifecycle.daysSadBeforeRunAway) },
              { label: text.breeding.away, value: days(ranch.lifecycle.daysRunAwayBeforeDespawn) },
            ]}
          />
          <p className="text-sm">
            <Link href={localizedPath(locale, "/animals")} className={LINK_CLASS}>
              {text.structures.title}
            </Link>
          </p>
        </Section>
      ) : (
        <p className="text-muted">{text.wildOnlyNote}</p>
      )}
    </article>
  );
}
