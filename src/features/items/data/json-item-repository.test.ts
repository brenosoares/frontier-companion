import { describe, expect, it } from "vitest";
import type { Item } from "../domain/item";
import { JsonItemRepository } from "./json-item-repository";

const item: Item = {
  id: "TestOre",
  name: { en: "Test Ore", "pt-BR": "Minério de Teste" },
  description: null,
  tags: ["Metal"],
  weight: 10,
  sellValue: 5,
  icon: null,
  featureFlag: null,
  isVirtual: false,
};

describe("JsonItemRepository", () => {
  it("serves items from the loader", async () => {
    const repository = new JsonItemRepository(async () => [item]);

    expect(await repository.getAll()).toEqual([item]);
    expect(await repository.getById("TestOre")).toEqual(item);
    expect(await repository.getById("nope")).toBeNull();
  });

  it("refuses malformed data", async () => {
    const repository = new JsonItemRepository(async () => [{ ...item, weight: -1 }]);
    await expect(repository.getAll()).rejects.toThrow(/Invalid items data/);
  });
});
