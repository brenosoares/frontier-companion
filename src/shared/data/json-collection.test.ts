import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { JsonCollection } from "./json-collection";

const Schema = z.object({ id: z.string(), value: z.number() });

describe("JsonCollection", () => {
  it("returns validated entities and looks them up by id", async () => {
    const collection = new JsonCollection(Schema, async () => [{ id: "a", value: 1 }], "test");

    expect(await collection.all()).toEqual([{ id: "a", value: 1 }]);
    expect(await collection.byId("a")).toEqual({ id: "a", value: 1 });
    expect(await collection.byId("missing")).toBeNull();
  });

  it("loads only once (cached)", async () => {
    const load = vi.fn(async () => [{ id: "a", value: 1 }]);
    const collection = new JsonCollection(Schema, load, "test");

    await collection.all();
    await collection.byId("a");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("rejects data that does not match the schema", async () => {
    const collection = new JsonCollection(Schema, async () => [{ id: "a", value: "x" }], "widget");
    await expect(collection.all()).rejects.toThrow(/Invalid widget data/);
  });
});
