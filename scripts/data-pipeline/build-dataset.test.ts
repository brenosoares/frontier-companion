// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildDataset, type RawTableSource } from "./build-dataset";
import { STATIONS } from "./config";
import { dataTableFile, rawConstruct, rawItem, rawRecipe } from "./__fixtures__/tables";

function memorySource(tables: Record<string, Record<string, unknown>>): RawTableSource {
  return {
    async readTable(name) {
      return dataTableFile(tables[name] ?? {});
    },
  };
}

const furnaceTable = "DT_FurnaceRecipe";
const noIcons = new Set<string>();

/** Every configured station needs a construct row (or a fallback name) for the build to succeed. */
const constructs = Object.fromEntries(
  STATIONS.flatMap(({ constructId }) =>
    constructId ? [[constructId, rawConstruct(`${constructId} EN`, `${constructId} PT`)]] : [],
  ),
);

describe("buildDataset", () => {
  it("builds a consistent dataset end to end", async () => {
    const recipe = rawRecipe("TestBar", { TestOre: 1 });
    const result = await buildDataset(
      memorySource({
        DT_Items: { TestOre: rawItem("TestOre"), TestBar: rawItem("TestBar") },
        DT_CompositeRecipes: { TestBar1: recipe },
        DT_Constructs: constructs,
        [furnaceTable]: { TestBar1: recipe },
      }),
      noIcons,
    );

    expect(result.integrityIssues).toEqual([]);
    expect(result.sensitiveFindings).toEqual([]);
    expect(result.dataset.items.map((item) => item.id)).toEqual(["TestBar", "TestOre"]);
    expect(result.dataset.recipes[0]?.stations).toEqual(["Furnace"]);
    expect(result.dataset.stations.find((station) => station.id === "Furnace")?.name).toEqual({
      en: "Furnace EN",
      "pt-BR": "Furnace PT",
    });
  });

  it("surfaces dangling references instead of throwing", async () => {
    const result = await buildDataset(
      memorySource({
        DT_Items: { TestOre: rawItem("TestOre") },
        DT_CompositeRecipes: { Bad1: rawRecipe("Ghost", { TestOre: 1 }) },
        DT_Constructs: constructs,
      }),
      noIcons,
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
        DT_Constructs: constructs,
      }),
      noIcons,
    );
    expect(result.sensitiveFindings).toHaveLength(1);
  });

  it("covers every configured station table exactly once", () => {
    const tables = STATIONS.map(({ table }) => table);
    const stations = STATIONS.map(({ id }) => id);
    expect(new Set(tables).size).toBe(tables.length);
    expect(new Set(stations).size).toBe(stations.length);
  });
});
