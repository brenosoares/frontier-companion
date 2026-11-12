import { RELEASED_FEATURE_FLAGS, STATIONS } from "./config";
import { extractBlueprintPrices, extractConstructs } from "./extractors/constructs";
import { extractItems } from "./extractors/items";
import { extractRecipes } from "./extractors/recipes";
import {
  extractAnimalSources,
  extractNodeSources,
  extractPlantSources,
  filterUsableSources,
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
  ]);

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
  const { kept: itemSources, warnings: sourceWarnings } = filterUsableSources(
    sortSources([
      ...extractNodeSources(nodeRows),
      ...extractPlantSources([smallPlantRows, largePlantRows], new Set(Object.keys(nodeRows))),
      ...extractAnimalSources(animalRows, critterRows),
    ]),
    new Set(items.map((item) => item.id)),
  );

  const dataset: Dataset = {
    items,
    recipes: unfinished.recipes,
    stations: extractStations(STATIONS, constructRows),
    itemSources,
    constructs: builtConstructs.constructs,
  };

  return {
    dataset,
    warnings: [...unfinished.warnings, ...builtConstructs.warnings, ...sourceWarnings],
    integrityIssues: checkIntegrity(dataset),
    sensitiveFindings: findSensitiveStrings(dataset),
  };
}
