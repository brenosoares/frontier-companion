import type { Metadata } from "next";
import { PlantCard } from "@/features/plants/components/plant-card";
import { PLANT_KINDS } from "@/features/plants/domain/plant";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { itemRepository, plantRepository } from "../data";
import { resolveLocale } from "../resolve-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plants">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).plants.title };
}

export default async function PlantsPage({ params }: PageProps<"/[locale]/plants">) {
  const locale = await resolveLocale(params);
  const { plants: text } = getMessages(locale);

  const [plants, items] = await Promise.all([plantRepository.getAll(), itemRepository.getAll()]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });

  const days = (count: number) =>
    formatTemplate(count === 1 ? text.days.one : text.days.other, {
      count: formatNumber(count, locale),
    });

  return (
    <div className="flex max-w-6xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{text.intro}</p>
      </header>

      {PLANT_KINDS.map((kind) => (
        <section key={kind} className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{text.groups[kind]}</h2>
            <p className="text-muted">{text.groupIntros[kind]}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plants
              .filter((plant) => plant.kind === kind)
              .sort((a, b) => collator.compare(a.name[locale], b.name[locale]))
              .map((plant) => {
                const seed = plant.seedItemId ? itemById.get(plant.seedItemId) : undefined;
                return (
                  <li key={plant.id}>
                    <PlantCard
                      href={localizedPath(locale, `/plants/${plant.id}`)}
                      name={plant.name[locale]}
                      icon={plant.icon}
                      type={plant.cropType ? text.types[plant.cropType] : null}
                      mature={formatTemplate(text.mature, { days: days(plant.daysToMature) })}
                      seed={seed ? { name: seed.name[locale], icon: seed.icon } : null}
                      seedLabel={text.seedLabel}
                    />
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
