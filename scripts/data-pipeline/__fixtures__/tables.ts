/**
 * Synthetic DataTable fixtures. Names/values are INVENTED (not game data) but mirror the real
 * export shape, including GUID-suffixed struct fields, so tests can be committed safely.
 */
const GUID = "0123456789ABCDEF0123456789ABCDEF";

export const rawText = (en: string, ptBR: string) => ({
  Namespace: "Test",
  Key: en,
  SourceString: en,
  LocalizedString: ptBR,
});

export const emptyText = { CultureInvariantString: null };

export function rawItem(id: string, overrides: Record<string, unknown> = {}) {
  return {
    EngineName: id,
    DisplayName: rawText(`${id} name`, `${id} nome`),
    Description: rawText(`${id} desc`, `${id} descrição`),
    Tags: ["EItemTag::Metal"],
    VirtualType: "EVirtualItemType::NonVirtual",
    FeatureFlag: { TagName: "None" },
    Icon: { AssetPathName: `/Game/Graphics/UI/Icons/T_${id}Icon.T_${id}Icon`, SubPathString: "" },
    Weight: 10,
    SellValue: 5,
    ...overrides,
  };
}

/** A complete, valid construct row (GUID-suffixed fields, as in the real export). */
export function rawConstruct(en: string, ptBR: string) {
  return {
    [`DisplayName_30_${GUID}`]: rawText(en, ptBR),
    [`Description_9_${GUID}`]: { CultureInvariantString: null },
    [`Category_61_${GUID}`]: "MainConstructCategory::NewEnumerator1",
    [`Type_41_${GUID}`]: "ConstructType::NewEnumerator9",
    [`VariantFamily_71_${GUID}`]: { TagName: "None" },
    [`FeatureFlag_68_${GUID}`]: { TagName: "None" },
    [`Icon_5_${GUID}`]: { AssetPathName: "None", SubPathString: "" },
    [`ItemCost_8_${GUID}`]: [],
    [`Coziness_2_${GUID}`]: 0,
  };
}

export function rawRecipe(output: string, inputs: Record<string, number>, time = 60) {
  return {
    [`Output_34_${GUID}`]: { Name: output, Amount: 1 },
    [`BookLevelRequirement_18_${GUID}`]: 0,
    [`Time_15_${GUID}`]: time,
    [`Input_35_${GUID}`]: Object.entries(inputs).map(([Key, Value]) => ({ Key, Value })),
  };
}

export const dataTableFile = (rows: Record<string, unknown>) => [
  { Type: "DataTable", Name: "DT_Test", Rows: rows },
];
