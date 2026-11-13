import { RELEASED_FEATURE_FLAGS, STATIONS } from "./config";
import { extractPlants } from "./extractors/plants";
import { extractMechChips, extractMechParts, extractMechStats } from "./extractors/mech";
import { extractAnimals } from "./extractors/animals";
import {
  BLUEPRINT_PATHS,
  blueprintDefaults,
  critterFeedSources,
  extractHazardSources,
  extractIncubator,
  extractLargeItemSources,
  extractLootGoblinSources,
  extractWildFeeding,
} from "./extractors/blueprints";
import { extractBlueprintPrices, extractConstructs } from "./extractors/constructs";
import { extractItems } from "./extractors/items";
import { extractRecipes } from "./extractors/recipes";
import {
  extractAnimalSources,
  extractCarePackageSources,
  extractMerchantSources,
  extractMutationSources,
  extractNodeSources,
  extractPlantSources,
  filterUsableSources,
  reconcileItemIdCase,
  sortSources,
} from "./extractors/sources";
import { extractStations } from "./extractors/stations";
import { checkIntegrity, type Dataset } from "./quality/integrity";
import { dropUnfinishedConstructs, dropUnfinishedItems } from "./quality/unfinished";
import { findSensitiveStrings, type SensitiveFinding } from "./quality/sanitize";
import { parseDataTableRows } from "./unreal/normalize";

/** Port: where raw tables come from (filesystem in production, memory in tests). */
export interface RawTableSource {
  readTable(tableName: string): Promise<unknown>;
  /** A Blueprint export, by path relative to `Content/Blueprints`. */
  readBlueprint(relativePath: string): Promise<unknown>;
  /** Blueprint files directly inside a directory (`BP_*.json` file names). */
  listBlueprints(relativeDirectory: string): Promise<string[]>;
}

export interface BuildResult {
  dataset: Dataset;
  /** Problems in the game data itself that were worked around (e.g. dropped dangling sources). */
  warnings: string[];
  integrityIssues: string[];
  sensitiveFindings: SensitiveFinding[];
}

async function readRows(
  source: RawTableSource,
  tableName: string,
): Promise<Record<string, unknown>> {
  return parseDataTableRows(await source.readTable(tableName), tableName);
}

async function readDefaults(
  source: RawTableSource,
  relativePath: string,
): Promise<Record<string, unknown>> {
  return blueprintDefaults(await source.readBlueprint(relativePath), relativePath);
}

async function readStationRows(
  source: RawTableSource,
): Promise<Record<string, Record<string, unknown>>> {
  const entries = await Promise.all(
    STATIONS.map(async ({ id, table }) => [id, await readRows(source, table)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * @param iconNames file names (without extension) available in the icon set; content whose icon
 *   is not in it gets `icon: null`.
 * @param releasedFlags feature flags confirmed as released: they stop hiding content.
 */
export async function buildDataset(
  source: RawTableSource,
  iconNames: ReadonlySet<string>,
  releasedFlags: ReadonlySet<string> = RELEASED_FEATURE_FLAGS,
): Promise<BuildResult> {
  const [
    itemRows,
    compositeRows,
    constructRows,
    stationRows,
    nodeRows,
    smallPlantRows,
    largePlantRows,
    animalRows,
    critterRows,
    merchantEntryRows,
    carePackageRows,
    critterFoodRows,
    moduleRows,
    chipRows,
    statDisplayRows,
    seedRows,
  ] = await Promise.all([
    readRows(source, "DT_Items"),
    readRows(source, "DT_CompositeRecipes"),
    readRows(source, "DT_Constructs"),
    readStationRows(source),
    readRows(source, "DT_Nodes"),
    readRows(source, "DT_SmallPlants"),
    readRows(source, "DT_LargePlants"),
    readRows(source, "DT_RanchAnimals"),
    readRows(source, "DT_Critters"),
    readRows(source, "DT_MerchantBundleEntries"),
    readRows(source, "DT_CarePackageRewards"),
    readRows(source, "DT_CritterFood"),
    readRows(source, "DT_Modules"),
    readRows(source, "DT_CoreUpgrades"),
    readRows(source, "DT_StatDisplay"),
    readRows(source, "DT_PlantToSeed"),
  ]);

  const [critterParent, incubatorDefaults, hazardDefaults, lootGoblinDefaults, largeItemFiles] =
    await Promise.all([
      readDefaults(source, BLUEPRINT_PATHS.critterParent),
      readDefaults(source, BLUEPRINT_PATHS.eggIncubator),
      readDefaults(source, BLUEPRINT_PATHS.hazardBreakable),
      readDefaults(source, BLUEPRINT_PATHS.lootGoblin),
      source.listBlueprints(BLUEPRINT_PATHS.largeItemsDirectory),
    ]);
  const largeItems = await Promise.all(
    largeItemFiles.map(async (file) => ({
      label: file,
      defaults: await readDefaults(source, `${BLUEPRINT_PATHS.largeItemsDirectory}/${file}`),
    })),
  );
  const wildFeeding = new Map(
    await Promise.all(
      Object.keys(critterRows).map(
        async (id) =>
          [
            id,
            extractWildFeeding(
              await readDefaults(source, BLUEPRINT_PATHS.critter(id)),
              critterParent,
              id,
            ),
          ] as const,
      ),
    ),
  );
  const { incubator, eggToAnimal } = extractIncubator(incubatorDefaults);

  const unfinished = dropUnfinishedItems(
    extractItems(itemRows, { availableIcons: iconNames, releasedFlags }),
    extractRecipes(compositeRows, stationRows),
  );
  const { items } = unfinished;
  const builtConstructs = dropUnfinishedConstructs(
    extractConstructs(constructRows, {
      availableIcons: iconNames,
      releasedFlags,
      blueprintPrices: extractBlueprintPrices(merchantEntryRows),
    }),
  );
  const builtPlants = extractPlants(smallPlantRows, largePlantRows, seedRows, {
    availableIcons: iconNames,
  });
  const mechOptions = { availableIcons: iconNames, releasedFlags };
  const mechStats = extractMechStats(statDisplayRows);
  const builtMechParts = extractMechParts(moduleRows, mechStats, mechOptions);
  const builtMechChips = extractMechChips(chipRows, mechOptions);
  const animals = extractAnimals(animalRows, critterRows, critterFoodRows, {
    availableIcons: iconNames,
    wildFeeding,
    eggToAnimal,
  });
  const itemIds = new Set(items.map((item) => item.id));
  const { kept: itemSources, warnings: sourceWarnings } = filterUsableSources(
    reconcileItemIdCase(
      sortSources([
        ...extractNodeSources(nodeRows),
        ...extractPlantSources([smallPlantRows, largePlantRows], new Set(Object.keys(nodeRows))),
        ...extractAnimalSources(animalRows, critterRows),
        ...extractMerchantSources(merchantEntryRows),
        ...extractCarePackageSources(carePackageRows),
        ...extractMutationSources(items),
        ...extractLargeItemSources(largeItems, new Map(items.map((item) => [item.id, item.name]))),
        ...extractHazardSources(hazardDefaults),
        ...extractLootGoblinSources(lootGoblinDefaults),
        ...animals.flatMap((animal) => {
          const feeding = wildFeeding.get(animal.id);
          return feeding ? critterFeedSources(animal.id, animal.name, feeding) : [];
        }),
      ]),
      itemIds,
    ),
    itemIds,
  );

  const dataset: Dataset = {
    items,
    recipes: unfinished.recipes,
    stations: extractStations(STATIONS, constructRows),
    itemSources,
    constructs: builtConstructs.constructs,
    animals,
    incubator,
    mechStats,
    mechParts: builtMechParts.parts,
    mechChips: builtMechChips.chips,
    plants: builtPlants.plants,
  };

  return {
    dataset,
    warnings: [
      ...unfinished.warnings,
      ...builtConstructs.warnings,
      ...builtMechParts.warnings,
      ...builtMechChips.warnings,
      ...builtPlants.warnings,
      ...sourceWarnings,
    ],
    integrityIssues: checkIntegrity(dataset),
    sensitiveFindings: findSensitiveStrings(dataset),
  };
}
