import type { Metadata } from "next";
import { AnimalCard } from "@/features/animals/components/animal-card";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { normalizeText } from "@/shared/lib/text";
import { CraftCard, type CraftCardEntry } from "@/shared/ui/craft-card";
import { animalRepository, constructRepository, itemRepository } from "../data";
import { resolveLocale } from "../resolve-locale";
import { RANCH_STRUCTURES } from "./ranch-structures";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/animals">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).animals.title };
}

export default async function AnimalsPage({ params }: PageProps<"/[locale]/animals">) {
  const locale = await resolveLocale(params);
  const { animals: text, recipesHub } = getMessages(locale);

  const [animals, items, constructs] = await Promise.all([
    animalRepository.getAll(),
    itemRepository.getAll(),
    constructRepository.getAll(),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const constructById = new Map(constructs.map((construct) => [construct.id, construct]));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });

  const cards = [...animals]
    .sort((a, b) => collator.compare(a.name[locale], b.name[locale]))
    .map((animal) => {
      const product = itemById.get(animal.loot.product.itemId);
      return {
        key: animal.id,
        data: {
          href: localizedPath(locale, `/animals/${animal.id}`),
          name: animal.name[locale],
          icon: animal.icon,
          diet: text.diets[animal.diet],
          product: {
            name: product?.name[locale] ?? animal.loot.product.itemId,
            icon: product?.icon ?? null,
          },
          productLabel: text.loot.product,
        },
      };
    });

  const structureCard = (id: string): CraftCardEntry | null => {
    const construct = constructById.get(id);
    if (!construct) return null;
    return {
      id: construct.id,
      href: localizedPath(locale, `/constructs/${construct.id}`),
      name: construct.name[locale],
      icon: construct.icon,
      iconKind: "construct",
      costs: construct.costs.map(({ itemId, amount }) => ({
        name: itemById.get(itemId)?.name[locale] ?? itemId,
        amount,
        icon: itemById.get(itemId)?.icon ?? null,
      })),
      madeIn: [recipesHub.cards.buildMode],
      unavailable: construct.featureFlag !== null,
      searchText: normalizeText(construct.name.en),
    };
  };

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{text.intro}</p>
      </header>

      <section aria-label={text.title}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ key, data }) => (
            <li key={key}>
              <AnimalCard {...data} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{text.structures.title}</h2>
          <p className="text-muted">{text.structures.intro}</p>
        </div>
        {RANCH_STRUCTURES.map(({ group, constructIds }) => {
          const entries = constructIds.flatMap((id) => structureCard(id) ?? []);
          if (entries.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{text.structures.groups[group]}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <CraftCard entry={entry} locale={locale} labels={{ ...recipesHub.cards }} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
