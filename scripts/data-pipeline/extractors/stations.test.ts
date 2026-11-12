// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawConstruct } from "../__fixtures__/tables";
import type { StationDefinition } from "../config";
import { extractStations } from "./stations";

const constructs = { Furnace: rawConstruct("Furnace", "Fornalha") };

describe("extractStations", () => {
  it("takes the localized name from the construct, ignoring GUID suffixes", () => {
    const definitions: StationDefinition[] = [
      { id: "Furnace", table: "DT_FurnaceRecipe", family: "Furnace", constructId: "Furnace" },
    ];
    expect(extractStations(definitions, constructs)).toEqual([
      { id: "Furnace", family: "Furnace", name: { en: "Furnace", "pt-BR": "Fornalha" } },
    ]);
  });

  it("uses the fallback name when the station is not a construct", () => {
    const definitions: StationDefinition[] = [
      {
        id: "Modifier",
        table: "DT_X",
        family: "Modifier",
        constructId: null,
        fallbackName: { en: "Seed Modifier", "pt-BR": "Modificador de Sementes" },
      },
    ];
    expect(extractStations(definitions, {})[0]?.name["pt-BR"]).toBe("Modificador de Sementes");
  });

  it("sorts by id", () => {
    const fallbackName = { en: "N", "pt-BR": "N" };
    const definitions: StationDefinition[] = [
      { id: "B", table: "T", family: "B", constructId: null, fallbackName },
      { id: "A", table: "T", family: "A", constructId: null, fallbackName },
    ];
    expect(extractStations(definitions, {}).map((station) => station.id)).toEqual(["A", "B"]);
  });

  it("fails loudly on a missing construct, a missing fallback or an empty name", () => {
    expect(() =>
      extractStations([{ id: "X", table: "T", family: "X", constructId: "Ghost" }], constructs),
    ).toThrow(/unknown construct "Ghost"/);
    expect(() =>
      extractStations([{ id: "X", table: "T", family: "X", constructId: null }], {}),
    ).toThrow(/no fallbackName/);
    const emptyName = { E: { DisplayName: { CultureInvariantString: null } } };
    expect(() =>
      extractStations([{ id: "X", table: "T", family: "X", constructId: "E" }], emptyName),
    ).toThrow(/no usable display name/);
  });

  it("carries the machine family, shared by the tiers", () => {
    const definitions: StationDefinition[] = [
      { id: "Furnace3", table: "T", family: "Furnace", constructId: "Furnace" },
    ];
    expect(extractStations(definitions, constructs)[0]?.family).toBe("Furnace");
  });
});
