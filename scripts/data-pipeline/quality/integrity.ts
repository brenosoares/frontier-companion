import type { Plant } from "@/features/plants/domain/plant";
import type { MechChip, MechPart, MechStat } from "@/features/mech/domain/mech";
import type { Animal, Incubator } from "@/features/animals/domain/animal";
import type { Construct } from "@/features/constructs/domain/construct";
import type { Item } from "@/features/items/domain/item";
import type { ItemSource } from "@/features/items/domain/item-source";
import type { Recipe } from "@/features/recipes/domain/recipe";
import type { Station } from "@/features/recipes/domain/station";

export interface Dataset {
  items: readonly Item[];
  recipes: readonly Recipe[];
  stations: readonly Station[];
  itemSources: readonly ItemSource[];
  constructs: readonly Construct[];
  animals: readonly Animal[];
  incubator: Incubator;
  mechStats: readonly MechStat[];
  mechParts: readonly MechPart[];
  mechChips: readonly MechChip[];
  plants: readonly Plant[];
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

/** Referential integrity. Returns human-readable issues; empty means the dataset is consistent. */
export function checkIntegrity({
  items,
  recipes,
  stations,
  itemSources,
  constructs,
  mechStats,
  mechParts,
  mechChips,
  plants,
  animals,
}: Dataset): string[] {
  const issues: string[] = [];
  const itemIds = new Set(items.map((item) => item.id));
  const stationIds = new Set(stations.map((station) => station.id));

  for (const id of findDuplicates(items.map((item) => item.id))) {
    issues.push(`Duplicate item id "${id}"`);
  }
  for (const id of findDuplicates(recipes.map((recipe) => recipe.id))) {
    issues.push(`Duplicate recipe id "${id}"`);
  }
  for (const id of findDuplicates(stations.map((station) => station.id))) {
    issues.push(`Duplicate station id "${id}"`);
  }

  for (const id of findDuplicates(itemSources.map((source) => source.id))) {
    issues.push(`Duplicate item source id "${id}"`);
  }
  for (const source of itemSources) {
    if (!itemIds.has(source.itemId)) {
      issues.push(`Item source "${source.id}" references unknown item "${source.itemId}"`);
    }
    if (source.kind === "mutation" && !itemIds.has(source.sourceId)) {
      issues.push(`Item source "${source.id}" grows from unknown seed "${source.sourceId}"`);
    }
  }

  for (const id of findDuplicates(constructs.map((construct) => construct.id))) {
    issues.push(`Duplicate construct id "${id}"`);
  }
  for (const construct of constructs) {
    for (const { itemId } of construct.costs) {
      if (!itemIds.has(itemId)) {
        issues.push(`Construct "${construct.id}" costs unknown item "${itemId}"`);
      }
    }
  }
  for (const id of findDuplicates(animals.map((animal) => animal.id))) {
    issues.push(`Duplicate animal id "${id}"`);
  }
  for (const animal of animals) {
    const referenced = [
      ["fodder", animal.fodderItemId],
      ["wild resource", animal.wildFeeding.resourceItemId],
      ...(animal.wildFeeding.egg ? [["egg", animal.wildFeeding.egg.itemId] as const] : []),
      ...(animal.ranch
        ? [
            ["product", animal.ranch.loot.product.itemId] as const,
            ["droppings", animal.ranch.loot.droppings.itemId] as const,
          ]
        : []),
    ];
    for (const [role, itemId] of referenced) {
      if (!itemIds.has(itemId)) {
        issues.push(`Animal "${animal.id}" has unknown ${role} item "${itemId}"`);
      }
    }
  }
  for (const id of findDuplicates(plants.map((plant) => plant.id))) {
    issues.push(`Duplicate plant id "${id}"`);
  }
  for (const plant of plants) {
    const referenced = [
      ...(plant.seedItemId ? [["seed", plant.seedItemId] as const] : []),
      ...plant.drops.map(({ itemId }) => ["drop", itemId] as const),
      ...(plant.fruit?.drops ?? []).map(({ itemId }) => ["fruit", itemId] as const),
    ];
    for (const [role, itemId] of referenced) {
      if (!itemIds.has(itemId)) {
        issues.push(`Plant "${plant.id}" has unknown ${role} item "${itemId}"`);
      }
    }
  }
  const statIds = new Set(mechStats.map((stat) => stat.id));
  for (const id of findDuplicates(mechParts.map((part) => part.id))) {
    issues.push(`Duplicate mech part id "${id}"`);
  }
  for (const part of mechParts) {
    for (const { itemId } of part.costs) {
      if (!itemIds.has(itemId))
        issues.push(`Mech part "${part.id}" costs unknown item "${itemId}"`);
    }
    for (const { stat } of part.stats) {
      if (!statIds.has(stat)) issues.push(`Mech part "${part.id}" has unknown stat "${stat}"`);
    }
  }
  for (const id of findDuplicates(mechChips.map((chip) => chip.id))) {
    issues.push(`Duplicate mech chip id "${id}"`);
  }
  for (const chip of mechChips) {
    for (const { itemId } of chip.costs) {
      if (!itemIds.has(itemId))
        issues.push(`Mech chip "${chip.id}" costs unknown item "${itemId}"`);
    }
  }
  for (const station of stations) {
    if (!stationIds.has(station.family)) {
      issues.push(`Station "${station.id}" belongs to unknown family "${station.family}"`);
    }
  }

  for (const recipe of recipes) {
    const referenced = [recipe.output, ...recipe.inputs];
    for (const { itemId } of referenced) {
      if (!itemIds.has(itemId)) {
        issues.push(`Recipe "${recipe.id}" references unknown item "${itemId}"`);
      }
    }
    for (const stationId of recipe.stations) {
      if (!stationIds.has(stationId)) {
        issues.push(`Recipe "${recipe.id}" references unknown station "${stationId}"`);
      }
    }
  }
  return issues;
}
