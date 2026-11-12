import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPLORER_STATE,
  isDefaultState,
  parseExplorerState,
  serializeExplorerState,
} from "./explorer-state";

const parse = (query: string) => parseExplorerState(new URLSearchParams(query));

describe("parseExplorerState", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(DEFAULT_EXPLORER_STATE);
  });

  it("reads every parameter", () => {
    expect(parse("q=oil&tag=Metal&sort=value&unavailable=1")).toEqual({
      query: "oil",
      tag: "Metal",
      sort: "value",
      showUnavailable: true,
    });
  });

  it("falls back to defaults for invalid values", () => {
    const state = parse("sort=hacked&unavailable=yes&tag=");
    expect(state.sort).toBe("name");
    expect(state.showUnavailable).toBe(false);
    expect(state.tag).toBeNull();
  });

  it("caps an oversized query", () => {
    expect(parse(`q=${"a".repeat(500)}`).query).toHaveLength(100);
  });
});

describe("serializeExplorerState", () => {
  it("omits default values", () => {
    expect(serializeExplorerState(DEFAULT_EXPLORER_STATE)).toBe("");
  });

  it("round-trips a customized state", () => {
    const state = {
      query: "óleo raro",
      tag: "Oil",
      sort: "weight" as const,
      showUnavailable: true,
    };
    expect(parse(serializeExplorerState(state))).toEqual(state);
  });
});

describe("isDefaultState", () => {
  it("detects untouched and modified state", () => {
    expect(isDefaultState(DEFAULT_EXPLORER_STATE)).toBe(true);
    expect(isDefaultState({ ...DEFAULT_EXPLORER_STATE, query: "x" })).toBe(false);
  });
});
