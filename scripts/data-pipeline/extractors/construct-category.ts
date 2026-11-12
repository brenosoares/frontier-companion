import type { ConstructCategory } from "@/features/constructs/domain/construct";

/**
 * The raw data gives each construct only a main tab (`MainConstructCategory::NewEnumeratorN`) and
 * an unnamed type code (`ConstructType::NewEnumeratorN`). The official sub-category names exist in
 * the localization, but nothing links them to the codes. These rules are our classification,
 * inferred from the contents of each (tab, type) group, and are meant to be reviewed.
 *
 *   tab 0 = Constructs, tab 1 = Decorations (matches the contents of every group).
 */
const BY_TAB_AND_TYPE: Readonly<Record<string, ConstructCategory>> = {
  // Constructs: machines, pipes, research stations
  "0:0": "constructs-crafting",
  // Constructs: farm centre, delivery cannon, beds, tents, generators
  "0:1": "constructs-essentials",
  // Constructs: plots
  "0:5": "constructs-farm",
  // Constructs: boxes, barrels, sheds, silo
  "0:8": "constructs-storage",
  // Constructs: crop crate and seed jar
  "0:10": "constructs-storage",
  // Constructs: foundations, floors, walls, roofs, beams, doors, windows
  "0:13": "constructs-modular",
  // Decorations
  "1:2": "decorations-fences",
  "1:4": "decorations-lights",
  "1:5": "decorations-plants",
  "1:6": "decorations-signs",
  "1:7": "decorations-ornaments",
  "1:9": "decorations-furniture",
  "1:10": "decorations-farm",
  "1:12": "decorations-wall-mounted",
  "1:13": "decorations-modular",
};

/** Variant families that override the (tab, type) rule: arches sit among the fences in the data. */
const BY_FAMILY: Readonly<Record<string, ConstructCategory>> = {
  Arch: "decorations-arches",
};

export interface ConstructClassification {
  /** `MainConstructCategory::NewEnumerator1` -> 1 */
  tab: number;
  /** `ConstructType::NewEnumerator13` -> 13 */
  type: number;
  /** `UI.ConstructVariantFamily.Arch` -> `Arch` ("None" when absent). */
  family: string;
}

/** Throws on an unknown group so a new patch cannot silently leave constructs uncategorized. */
export function classifyConstruct(id: string, { tab, type, family }: ConstructClassification) {
  const category = BY_FAMILY[family] ?? BY_TAB_AND_TYPE[`${tab}:${type}`];
  if (!category) {
    throw new Error(
      `Construct "${id}" (tab ${tab}, type ${type}, family ${family}) has no category: ` +
        "add a rule to construct-category.ts",
    );
  }
  return category;
}

/** `ConstructType::NewEnumerator13` -> 13. */
export function parseEnumeratorIndex(raw: string): number {
  const match = /NewEnumerator(\d+)$/.exec(raw);
  if (!match?.[1]) throw new Error(`Not a numbered enumerator: "${raw}"`);
  return Number(match[1]);
}
