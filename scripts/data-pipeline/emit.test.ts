// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildManifest, emitDataset } from "./emit";
import type { Dataset } from "./quality/integrity";

const dataset: Dataset = {
  items: [
    {
      id: "Ore",
      name: { en: "Ore", "pt-BR": "Minério" },
      description: null,
      tags: [],
      weight: 1,
      sellValue: 1,
      icon: null,
      featureFlag: null,
      isVirtual: false,
    },
  ],
  recipes: [],
  stations: [{ id: "Furnace", family: "Furnace", name: { en: "Furnace", "pt-BR": "Fornalha" } }],
  itemSources: [],
  constructs: [],
  animals: [],
  mechStats: [],
  mechParts: [],
  mechChips: [],
  incubator: {
    lensChances: { smaller: 25, larger: 25, double: 10, rare: 10 },
    rareEggIncubationDays: 5,
  },
};

let tempDir: string | undefined;
afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("buildManifest", () => {
  it("is deterministic and reports counts", () => {
    const a = buildManifest(dataset, "9.9.9");
    const b = buildManifest(structuredClone(dataset), "9.9.9");
    expect(a).toEqual(b);
    expect(a.counts).toEqual({
      items: 1,
      recipes: 0,
      stations: 1,
      itemSources: 0,
      constructs: 0,
      animals: 0,
      mechParts: 0,
      mechChips: 0,
    });
    expect(a.dataVersion).toMatch(/^[0-9a-f]{12}$/);
  });

  it("changes dataVersion when content changes", () => {
    const changed: Dataset = {
      ...dataset,
      items: dataset.items.map((item) => ({ ...item, weight: 2 })),
    };
    expect(buildManifest(changed, "9.9.9").dataVersion).not.toBe(
      buildManifest(dataset, "9.9.9").dataVersion,
    );
  });
});

describe("emitDataset", () => {
  it("writes items, recipes and manifest as UTF-8 JSON", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "fc-emit-"));
    const manifest = await emitDataset(tempDir, dataset, "9.9.9");

    const items = JSON.parse(await readFile(path.join(tempDir, "items.json"), "utf-8"));
    const written = JSON.parse(await readFile(path.join(tempDir, "manifest.json"), "utf-8"));
    expect(items[0].name["pt-BR"]).toBe("Minério");
    expect(written).toEqual(manifest);
  });
});
