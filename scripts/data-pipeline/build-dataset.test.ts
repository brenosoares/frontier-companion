// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildDataset, type RawTableSource } from "./build-dataset";
import { STATION_RECIPE_TABLES } from "./config";
import { dataTableFile, rawItem, rawRecipe } from "./__fixtures__/tables";

function memorySource(tables: Record<string, Record<string, unknown>>): RawTableSource {
  return {
    async readTable(name) {
      return dataTableFile(tables[name] ?? {});
    },
  };
}

const furnaceTable = "DT_FurnaceRecipe";

describe("buildDataset", () => {
  it("builds a consistent dataset end to end", async () => {
    const recipe = rawRecipe("TestBar", { TestOre: 1 });
    const result = await buildDataset(
      memorySource({
        DT_Items: { TestOre: rawItem("TestOre"), TestBar: rawItem("TestBar") },
        DT_CompositeRecipes: { TestBar1: recipe },
        [furnaceTable]: { TestBar1: recipe },
      }),
    );

    expect(result.integrityIssues).toEqual([]);
    expect(result.sensitiveFindings).toEqual([]);
    expect(result.dataset.items.map((item) => item.id)).toEqual(["TestBar", "TestOre"]);
    expect(result.dataset.recipes[0]?.stations).toEqual(["Furnace"]);
  });

  it("surfaces dangling references instead of throwing", async () => {
    const result = await buildDataset(
      memorySource({
        DT_Items: { TestOre: rawItem("TestOre") },
        DT_CompositeRecipes: { Bad1: rawRecipe("Ghost", { TestOre: 1 }) },
      }),
    );
    expect(result.integrityIssues).toEqual(['Recipe "Bad1" references unknown item "Ghost"']);
  });

  it("surfaces sensitive strings found in the data", async () => {
    const result = await buildDataset(
      memorySource({
        DT_Items: {
          Leaky: rawItem("Leaky", {
            Description: { SourceString: "see C:\\Users\\dev", LocalizedString: "ver" },
          }),
        },
        DT_CompositeRecipes: {},
      }),
    );
    expect(result.sensitiveFindings).toHaveLength(1);
  });

  it("covers every configured station table exactly once", () => {
    const tables = STATION_RECIPE_TABLES.map(([, table]) => table);
    const stations = STATION_RECIPE_TABLES.map(([station]) => station);
    expect(new Set(tables).size).toBe(tables.length);
    expect(new Set(stations).size).toBe(stations.length);
  });
});
