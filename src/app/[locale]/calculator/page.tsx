import type { Metadata } from "next";
import { Suspense } from "react";
import {
  type CalculatorItem,
  type CalculatorLabels,
  MaterialsCalculator,
} from "@/features/recipes/components/materials-calculator";
import { getMessages } from "@/shared/i18n/get-messages";
import type { Messages } from "@/shared/i18n/messages/types";
import { itemRepository, itemSourceRepository, recipeRepository, stationRepository } from "../data";
import { resolveLocale } from "../resolve-locale";

function toCalculatorLabels({ calculator, recipes }: Messages): CalculatorLabels {
  return {
    item: calculator.item,
    chooseItem: calculator.chooseItem,
    quantity: calculator.quantity,
    empty: calculator.empty,
    rawItem: calculator.rawItem,
    materials: calculator.materials,
    materialsHint: calculator.materialsHint,
    noKnownSource: calculator.noKnownSource,
    steps: calculator.steps,
    stepsHint: calculator.stepsHint,
    batchesOne: calculator.batches.one,
    batchesOther: calculator.batches.other,
    leftover: calculator.leftover,
    timePerBatch: calculator.timePerBatch,
    instant: recipes.instant,
    recipeVariant: calculator.recipeVariant,
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/calculator">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).calculator.title };
}

export default async function CalculatorPage({ params }: PageProps<"/[locale]/calculator">) {
  const locale = await resolveLocale(params);
  const messages = getMessages(locale);

  const [recipes, items, stations, sourcedIds] = await Promise.all([
    recipeRepository.getAll(),
    itemRepository.getAll(),
    stationRepository.getAll(),
    itemSourceRepository.getSourcedItemIds(),
  ]);

  const itemData: Record<string, CalculatorItem> = Object.fromEntries(
    items.map((item) => [
      item.id,
      { name: item.name[locale], icon: item.icon, hasSource: sourcedIds.has(item.id) },
    ]),
  );
  const stationNames = Object.fromEntries(
    stations.map((station) => [station.id, station.name[locale]]),
  );

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.calculator.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted">{messages.calculator.intro}</p>
      </header>

      {/* useSearchParams needs a Suspense boundary so the rest of the page stays static. */}
      <Suspense fallback={<p className="text-muted">{messages.calculator.loading}</p>}>
        <MaterialsCalculator
          recipes={[...recipes]}
          items={itemData}
          stations={stationNames}
          locale={locale}
          labels={toCalculatorLabels(messages)}
        />
      </Suspense>
    </div>
  );
}
