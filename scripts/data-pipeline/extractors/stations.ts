import { z } from "zod";
import { type Station, StationSchema } from "@/features/recipes/domain/station";
import type { StationDefinition } from "../config";
import { normalizeKeys } from "../unreal/normalize";
import { RawTextSchema, toLocalizedText } from "../unreal/localized";

const RawConstructSchema = z.object({ DisplayName: RawTextSchema });

function resolveName(definition: StationDefinition, constructRows: Record<string, unknown>) {
  if (definition.constructId === null) {
    if (!definition.fallbackName) {
      throw new Error(`Station "${definition.id}" has no construct and no fallbackName`);
    }
    return definition.fallbackName;
  }

  const row = constructRows[definition.constructId];
  if (row === undefined) {
    throw new Error(`Station "${definition.id}": unknown construct "${definition.constructId}"`);
  }
  const parsed = RawConstructSchema.safeParse(normalizeKeys(row));
  const name = parsed.success ? toLocalizedText(parsed.data.DisplayName) : null;
  if (!name) throw new Error(`Station "${definition.id}": construct has no usable display name`);
  return name;
}

export function extractStations(
  definitions: readonly StationDefinition[],
  constructRows: Record<string, unknown>,
): Station[] {
  return definitions
    .map((definition) =>
      StationSchema.parse({
        id: definition.id,
        family: definition.family,
        name: resolveName(definition, constructRows),
      }),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}
