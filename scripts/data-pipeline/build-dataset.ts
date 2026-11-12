import { STATION_RECIPE_TABLES } from "./config";
import { extractItems } from "./extractors/items";
import { extractRecipes } from "./extractors/recipes";
import { checkIntegrity, type Dataset } from "./quality/integrity";
import { findSensitiveStrings, type SensitiveFinding } from "./quality/sanitize";
import { parseDataTableRows } from "./unreal/normalize";

/** Port: where raw tables come from (filesystem in production, memory in tests). */
export interface RawTableSource {
  readTable(tableName: string): Promise<unknown>;
}

export interface BuildResult {
  dataset: Dataset;
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
    STATION_RECIPE_TABLES.map(
      async ([station, table]) => [station, await readRows(source, table)] as const,
    ),
  );
  return Object.fromEntries(entries);
}

export async function buildDataset(source: RawTableSource): Promise<BuildResult> {
  const [itemRows, compositeRows, stationRows] = await Promise.all([
    readRows(source, "DT_Items"),
    readRows(source, "DT_CompositeRecipes"),
    readStationRows(source),
  ]);

  const dataset: Dataset = {
    items: extractItems(itemRows),
    recipes: extractRecipes(compositeRows, stationRows),
  };

  return {
    dataset,
    integrityIssues: checkIntegrity(dataset),
    sensitiveFindings: findSensitiveStrings(dataset),
  };
}
