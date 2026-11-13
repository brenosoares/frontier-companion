// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawText } from "../__fixtures__/tables";
import { extractMechChips, extractMechParts, extractMechStats } from "./mech";

const options = {
  availableIcons: new Set(["HoseIcon", "SetIcon", "ChipIcon"]),
  releasedFlags: new Set<string>(["Limbo"]),
};

// ---- stats

const statRow = (name: string, format: string) => ({
  DisplayName_2_917009C94B138D6DC76194A921A8B395: rawText(name, `${name} PT`),
  Format_8_6FDB01854B9F252359EBCCBF13C2A9CC: `StatFormat::${format}`,
});

describe("extractMechStats", () => {
  it("names each stat with the game's text and maps its format to a kind", () => {
    const stats = extractMechStats({
      "Upgrade.Health.Max": statRow("Durability", "NewEnumerator0"),
      "Upgrade.Tool.Range": statRow("Tool Range", "NewEnumerator4"),
      "Upgrade.SpikeSaw.Swing.Unlock": statRow("Sweep", "NewEnumerator6"),
      "Upgrade.Tool.Range|Chips.Tool.ResourceVacuum": statRow("Tool Range", "NewEnumerator2"),
    });

    expect(stats).toEqual([
      { id: "Health.Max", name: { en: "Durability", "pt-BR": "Durability PT" }, kind: "number" },
      { id: "SpikeSaw.Swing.Unlock", name: { en: "Sweep", "pt-BR": "Sweep PT" }, kind: "unlock" },
      { id: "Tool.Range", name: { en: "Tool Range", "pt-BR": "Tool Range PT" }, kind: "percent" },
    ]);
  });

  it("fails on a format it does not know instead of guessing", () => {
    expect(() => extractMechStats({ "Upgrade.X": statRow("X", "NewEnumerator99") })).toThrow(
      /unknown format/,
    );
  });
});

// ---- parts

const stats = extractMechStats({
  "Upgrade.Health.Max": statRow("Durability", "NewEnumerator0"),
  "Upgrade.Slots": statRow("Mod Slots", "NewEnumerator0"),
  "Upgrade.Hauling.Capacity": statRow("Hauling", "NewEnumerator0"),
});

const moduleRow = (overrides: Record<string, unknown> = {}) => ({
  DisplayName: rawText("Irrigation Hose Mk. 1", "Jato Mk. 1"),
  Description: rawText("Waters <Mark1>crops</> ({UseToolPrimary}).", "Rega ({UseToolPrimary})."),
  Type: "EMechModuleType::Tool",
  ChipFamily: { TagName: "Chips.Tool.IrrigationHose" },
  Stats: [
    { Tag: { TagName: "Upgrade.Health.Max" }, Value: 1000 },
    { Tag: { TagName: "Upgrade.Slots" }, Value: 1 },
  ],
  ItemCost: [{ Name: "CopperOre", Amount: 3 }],
  Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_HoseIcon.T_HoseIcon" },
  NextUpgrade: "None",
  PairedRow: "None",
  ...overrides,
});

const tools = {
  // Rows are not in order: the chain decides.
  Hose2: moduleRow({
    DisplayName: rawText("Irrigation Hose Mk. ⎒", "Jato Mk. ⎒"),
    NextUpgrade: "None",
  }),
  Hose0: moduleRow({ NextUpgrade: "Hose1" }),
  Hose1: moduleRow({
    DisplayName: rawText("Irrigation Hose Mk. 2", "Jato Mk. 2"),
    NextUpgrade: "Hose2",
  }),
};

describe("extractMechParts: tools", () => {
  it("orders tiers along the upgrade chain and numbers the glyph-named last tier", () => {
    const { parts } = extractMechParts(tools, stats, options);

    expect(parts.map((part) => [part.id, part.tier, part.name.en, part.name["pt-BR"]])).toEqual([
      ["Hose0", 1, "Irrigation Hose Mk. 1", "Jato Mk. 1"],
      ["Hose1", 2, "Irrigation Hose Mk. 2", "Jato Mk. 2"],
      ["Hose2", 3, "Irrigation Hose Mk. 3", "Jato Mk. 3"],
    ]);
    expect(parts[0]).toMatchObject({
      category: "irrigation-hose",
      icon: "HoseIcon",
      costs: [{ itemId: "CopperOre", amount: 3 }],
      stats: [
        { stat: "Health.Max", value: 1000 },
        { stat: "Slots", value: 1 },
      ],
      featureFlag: null,
    });
  });

  it("reduces the description to plain text", () => {
    const [part] = extractMechParts(tools, stats, options).parts;
    expect(part?.description).toEqual({
      en: "Waters crops ([UseToolPrimary]).",
      "pt-BR": "Rega ([UseToolPrimary]).",
    });
  });

  it("leaves out skins and set selectors, which have no stats", () => {
    const { parts } = extractMechParts(
      { ...tools, HoseSkin: moduleRow({ Stats: [], ItemCost: [] }) },
      stats,
      options,
    );
    expect(parts.map((part) => part.id)).not.toContain("HoseSkin");
  });

  it("drops unfinished modules with a warning", () => {
    const { parts, warnings } = extractMechParts(
      {
        ...tools,
        HoseWip: moduleRow({ DisplayName: rawText("Hose WIP", "Jato WIP") }),
      },
      stats,
      options,
    );
    expect(parts).toHaveLength(3);
    expect(warnings).toEqual(['Dropped mech module "HoseWip": unfinished or obsolete content']);
  });

  it("fails on a stat without a name, an unknown family or a broken chain", () => {
    const unknownStat = moduleRow({ Stats: [{ Tag: { TagName: "Upgrade.Mystery" }, Value: 1 }] });
    expect(() => extractMechParts({ A: unknownStat }, stats, options)).toThrow(/unknown stat/);
    expect(() =>
      extractMechParts(
        { A: moduleRow({ ChipFamily: { TagName: "Chips.Tool.Laser" } }) },
        stats,
        options,
      ),
    ).toThrow(/unknown chip family/);
    expect(() =>
      extractMechParts(
        { A: moduleRow({ NextUpgrade: "B" }), B: moduleRow({ NextUpgrade: "A" }) },
        stats,
        options,
      ),
    ).toThrow(/expected one first tier/);
    expect(() =>
      extractMechParts(
        { A: moduleRow({ NextUpgrade: "B" }), B: moduleRow({ NextUpgrade: "B" }) },
        stats,
        options,
      ),
    ).toThrow(/broken tier chain/);
  });
});

describe("extractMechParts: arms and legs", () => {
  const arms = {
    StandardArmSet: moduleRow({
      DisplayName: rawText("Farmech Arm Set", "Conjunto de Braços"),
      Description: rawText("A set.", "Um conjunto."),
      Type: "EMechModuleType::ArmSet",
      ChipFamily: { TagName: "Chips.Mech.Arms" },
      Stats: [],
      ItemCost: [],
      Set: "Standard",
      Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_SetIcon.T_SetIcon" },
    }),
    StandardLeftArm: moduleRow({
      Type: "EMechModuleType::LeftArm",
      ChipFamily: { TagName: "Chips.Mech.Arms" },
      Stats: [
        { Tag: { TagName: "Upgrade.Health.Max" }, Value: 1000 },
        { Tag: { TagName: "Upgrade.Slots" }, Value: 0 },
      ],
      ItemCost: [],
      Set: "Standard",
      PairedRow: "StandardRightArm",
    }),
    StandardRightArm: moduleRow({
      Type: "EMechModuleType::RightArm",
      ChipFamily: { TagName: "Chips.Mech.Arms" },
      Stats: [
        { Tag: { TagName: "Upgrade.Health.Max" }, Value: 1000 },
        { Tag: { TagName: "Upgrade.Slots" }, Value: 1 },
        { Tag: { TagName: "Upgrade.Hauling.Capacity" }, Value: 4 },
      ],
      ItemCost: [{ Name: "CopperOre", Amount: 10 }],
      Set: "Standard",
      PairedRow: "StandardLeftArm",
    }),
  };

  it("makes one entry per pair: the right piece's cost and stats, the set's name and icon", () => {
    const { parts } = extractMechParts(arms, stats, options);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      id: "StandardArmSet",
      category: "arms",
      name: { en: "Farmech Arm Set" },
      icon: "SetIcon",
      costs: [{ itemId: "CopperOre", amount: 10 }],
      stats: [
        { stat: "Health.Max", value: 1000 },
        { stat: "Slots", value: 1 },
        { stat: "Hauling.Capacity", value: 4 },
      ],
    });
  });

  it("fails when the pair disagrees on durability or the set row is missing", () => {
    const mismatch = {
      ...arms,
      StandardLeftArm: moduleRow({
        ...arms.StandardLeftArm,
        Stats: [{ Tag: { TagName: "Upgrade.Health.Max" }, Value: 1 }],
      }),
    };
    expect(() => extractMechParts(mismatch, stats, options)).toThrow(/different durability/);

    const withoutSet = Object.fromEntries(
      Object.entries(arms).filter(([key]) => key !== "StandardArmSet"),
    );
    expect(() => extractMechParts(withoutSet, stats, options)).toThrow(/no ArmSet row/);
  });
});

// ---- chips

const chip = (overrides: Record<string, unknown> = {}) => ({
  DisplayName: rawText("Tool Range Lv. 1", "Alcance Nv. 1"),
  Description: rawText("Raises range by 30%.", "Aumenta o alcance em 30%."),
  PowerCost: 1,
  Tags: ["Chips.Tool"],
  ItemCost: [{ Name: "CopperOre", Amount: 2 }],
  Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_ChipIcon.T_ChipIcon" },
  FeatureFlag: { TagName: "None" },
  ...overrides,
});

describe("extractMechChips", () => {
  it("expands a general tag into every part it fits, in category order", () => {
    const { chips } = extractMechChips({ ToolRange0: chip() }, options);

    expect(chips[0]).toMatchObject({
      id: "ToolRange0",
      powerCost: 1,
      fits: ["spike-saw", "irrigation-hose", "resource-vacuum", "seed-shooter", "sprout-cannon"],
      unique: false,
      costs: [{ itemId: "CopperOre", amount: 2 }],
      icon: "ChipIcon",
      featureFlag: null,
    });
  });

  it("marks unique chips and merges the parts of several tags", () => {
    const { chips } = extractMechChips(
      { A: chip({ Tags: ["Chips.Unique", "Chips.Mech.Legs", "Chips.Mech.Engine"] }) },
      options,
    );
    expect(chips[0]).toMatchObject({ fits: ["engine", "legs"], unique: true });
  });

  it("keeps a chip with no part, and a flag that is not released", () => {
    const { chips } = extractMechChips(
      { A: chip({ Tags: [], FeatureFlag: { TagName: "Features.Secret" } }) },
      options,
    );
    expect(chips[0]).toMatchObject({ fits: [], featureFlag: "Secret" });
  });

  it("drops unfinished chips with a warning and fails on an unknown tag", () => {
    const { chips, warnings } = extractMechChips(
      { A: chip({ DisplayName: rawText("Chip [Wip]", "Chip [Wip]") }), B: chip() },
      options,
    );
    expect(chips.map((c) => c.id)).toEqual(["B"]);
    expect(warnings).toEqual(['Dropped chip "A": unfinished or obsolete content']);
    expect(() => extractMechChips({ A: chip({ Tags: ["Chips.Laser"] }) }, options)).toThrow(
      /unknown tag/,
    );
  });
});
