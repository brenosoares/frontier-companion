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
