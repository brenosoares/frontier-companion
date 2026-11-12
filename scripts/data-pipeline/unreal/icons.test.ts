// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveIcon } from "./icons";

const path = (stem: string) => `/Game/Graphics/UI/Icons/${stem}.${stem}`;

describe("resolveIcon", () => {
  const icons = new Set([
    "AdvancedFuel1Icon",
    "SeedMaker2Icon",
    "GlofruitIcon",
    "t_DroneStation2Icon",
  ]);

  it("finds the file for an exact name, dropping the T_ prefix", () => {
    expect(resolveIcon(path("T_AdvancedFuel1Icon"), icons)).toBe("AdvancedFuel1Icon");
  });

  it("ignores letter case: the game says Seedmaker2, the file is SeedMaker2", () => {
    expect(resolveIcon(path("T_Seedmaker2Icon"), icons)).toBe("SeedMaker2Icon");
    expect(resolveIcon(path("T_GloFruitIcon"), icons)).toBe("GlofruitIcon");
  });

  it("finds a file that kept a lower-case t_ prefix", () => {
    expect(resolveIcon(path("T_DroneStation2Icon"), icons)).toBe("t_DroneStation2Icon");
  });

  it("returns the real file name, so it can be copied and served as is", () => {
    expect(resolveIcon(path("T_SEEDMAKER2ICON"), icons)).toBe("SeedMaker2Icon");
  });

  it("prefers the file without a leftover prefix when both exist", () => {
    const both = new Set(["t_FooIcon", "FooIcon"]);
    expect(resolveIcon(path("T_FooIcon"), both)).toBe("FooIcon");
  });

  it.each(["None", "", path("T_MissingIcon")])("returns null for %j", (assetPath) => {
    expect(resolveIcon(assetPath, icons)).toBeNull();
  });
});
