import { z } from "zod";
import { type Animal, AnimalSchema } from "@/features/animals/domain/animal";
import { resolveIcon } from "../unreal/icons";
import type { WildFeeding } from "./blueprints";
import { RawTextSchema, toLocalizedText } from "../unreal/localized";
import { normalizeKeys, parseEnumValue } from "../unreal/normalize";

const RawLootSchema = z.object({ ItemName: z.string(), Count: z.number() });

const RawRanchAnimalSchema = z.object({
  DailyThirst: z.number(),
  DailyHunger: z.number(),
  MinSquareMeters: z.number(),
  MinNearbyAnimals: z.number(),
  IncubationDays: z.number(),
  GrowthDays: z.number(),
  DaysSadBeforeRunAway: z.number(),
  DaysRunAwayBeforeDespawn: z.number(),
  ItemDrop: RawLootSchema,
  Dropping: RawLootSchema,
  EggItem: z.string(),
  Icon: z.object({ AssetPathName: z.string() }),
});

const RawCritterSchema = z.object({ DisplayName: RawTextSchema, Diet: z.string() });

/** Each fodder item is a row of `DT_CritterFood` whose id is the item id and whose diet it feeds. */
const RawFodderSchema = z.object({ DietType: z.string() });

function parseRow<T>(schema: z.ZodType<T>, row: unknown, label: string): T {
  const parsed = schema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`${label} has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** diet -> fodder item id. Two fodders for one diet would be ambiguous, so it fails. */
function fodderByDiet(foodRows: Record<string, unknown>): Map<string, string> {
  const byDiet = new Map<string, string>();
  for (const [fodderId, row] of Object.entries(foodRows)) {
    const diet = parseEnumValue(parseRow(RawFodderSchema, row, `Fodder "${fodderId}"`).DietType);
    if (byDiet.has(diet)) throw new Error(`Diet "${diet}" has more than one fodder`);
    byDiet.set(diet, fodderId);
  }
  return byDiet;
}

export interface AnimalOptions {
  availableIcons: ReadonlySet<string>;
  /** What feeding each wild critter gives (from the blueprints). */
  wildFeeding: ReadonlyMap<string, WildFeeding>;
  /** Egg item -> animal it hatches (from the Egg Incubator blueprint). */
  eggToAnimal: ReadonlyMap<string, string>;
}

/**
 * Every critter of `DT_Critters` (name, diet), joined with what feeding it gives and, for the ones
 * that can be raised, its `DT_RanchAnimals` row. A ranch animal that is not a critter is an error:
 * the two tables describe the same creatures.
 */
export function extractAnimals(
  ranchRows: Record<string, unknown>,
  critterRows: Record<string, unknown>,
  foodRows: Record<string, unknown>,
  { availableIcons, wildFeeding, eggToAnimal }: AnimalOptions,
): Animal[] {
  const fodders = fodderByDiet(foodRows);
  for (const id of Object.keys(ranchRows)) {
    if (!(id in critterRows)) throw new Error(`Ranch animal "${id}" has no critter entry`);
  }

  return Object.entries(critterRows)
    .map(([id, critterRow]) => {
      const critter = parseRow(RawCritterSchema, critterRow, `Critter "${id}"`);
      const name = toLocalizedText(critter.DisplayName);
      if (!name) throw new Error(`Critter "${id}" has no display name`);
      const diet = parseEnumValue(critter.Diet);
      const fodderItemId = fodders.get(diet);
      if (!fodderItemId) throw new Error(`Animal "${id}": no fodder for diet "${diet}"`);

      const wild = wildFeeding.get(id);
      if (!wild) throw new Error(`Animal "${id}" has no wild feeding data`);

      const ranchRow = ranchRows[id];
      const ranch =
        ranchRow === undefined
          ? null
          : parseRow(RawRanchAnimalSchema, ranchRow, `Ranch animal "${id}"`);
      if (ranch) {
        if (wild.egg?.itemId !== ranch.EggItem) {
          throw new Error(
            `Animal "${id}": ranch egg "${ranch.EggItem}" differs from wild egg "${wild.egg?.itemId ?? "none"}"`,
          );
        }
        if (eggToAnimal.get(ranch.EggItem) !== id) {
          throw new Error(
            `Animal "${id}": the incubator does not hatch "${ranch.EggItem}" into it`,
          );
        }
      }

      return AnimalSchema.parse({
        id,
        name,
        icon: ranch ? resolveIcon(ranch.Icon.AssetPathName, availableIcons) : null,
        diet,
        fodderItemId,
        wildFeeding: { resourceItemId: wild.resourceItemId, egg: wild.egg },
        ranch: ranch && {
          loot: {
            product: { itemId: ranch.ItemDrop.ItemName, amount: ranch.ItemDrop.Count },
            droppings: { itemId: ranch.Dropping.ItemName, amount: ranch.Dropping.Count },
          },
          needs: {
            dailyThirst: ranch.DailyThirst,
            dailyHunger: ranch.DailyHunger,
            minSquareMeters: ranch.MinSquareMeters,
            minNearbyAnimals: ranch.MinNearbyAnimals,
          },
          lifecycle: {
            incubationDays: ranch.IncubationDays,
            growthDays: ranch.GrowthDays,
            daysSadBeforeRunAway: ranch.DaysSadBeforeRunAway,
            daysRunAwayBeforeDespawn: ranch.DaysRunAwayBeforeDespawn,
          },
        },
      });
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
