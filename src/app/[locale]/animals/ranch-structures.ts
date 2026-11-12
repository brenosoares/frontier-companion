export type RanchStructureGroup = "incubator" | "feeding" | "water" | "shelter" | "bed" | "care";

/**
 * What to build for the ranch. The game data does not group these (it only has the constructs),
 * so the list is curated by hand from their names and families. Every id is checked against the
 * dataset by a contract test, so a patch that renames one fails the build instead of dropping it.
 */
export const RANCH_STRUCTURES: readonly {
  group: RanchStructureGroup;
  constructIds: readonly string[];
}[] = [
  { group: "incubator", constructIds: ["EggIncubator"] },
  { group: "feeding", constructIds: ["FeedTrough", "UpgradedFeedTrough"] },
  { group: "water", constructIds: ["WaterTrough", "UpgradedWaterTrough"] },
  { group: "shelter", constructIds: ["AnimalShelterSmall", "AnimalShelter"] },
  { group: "bed", constructIds: ["AnimalBedSmall", "AnimalBedMed"] },
  { group: "care", constructIds: ["RanchAnimalOverview", "AnimalDresser"] },
];

export const RANCH_STRUCTURE_IDS: readonly string[] = RANCH_STRUCTURES.flatMap(
  ({ constructIds }) => constructIds,
);
