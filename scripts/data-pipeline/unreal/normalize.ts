import { z } from "zod";

/** Unreal "UserDefinedStruct" fields carry a numeric index + GUID suffix: `Time_15_23C4…` -> `Time`. */
const GUID_SUFFIX = /^(.+?)_\d+_[0-9A-F]{32}$/;

export function stripGuidSuffix(key: string): string {
  return GUID_SUFFIX.exec(key)?.[1] ?? key;
}

/** Recursively renames every object key with `stripGuidSuffix`. Throws on resulting key collisions. */
export function normalizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (value === null || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const clean = stripGuidSuffix(key);
    if (clean in result) throw new Error(`Key collision after normalization: "${clean}"`);
    result[clean] = normalizeKeys(child);
  }
  return result;
}

/** `EItemTag::Oil` -> `Oil`. */
export function parseEnumValue(raw: string): string {
  const separator = raw.lastIndexOf("::");
  return separator === -1 ? raw : raw.slice(separator + 2);
}

/** `/Game/Graphics/UI/Icons/T_X.T_X` -> `T_X`; `None`/empty -> null. */
export function assetStem(assetPath: string): string | null {
  if (assetPath === "" || assetPath === "None") return null;
  const file = assetPath.slice(assetPath.lastIndexOf("/") + 1);
  return file.split(".")[0] || null;
}

/** Feature flag tag: `Features.RanchAnimals` -> `RanchAnimals`; `None` -> null. */
export function parseFeatureFlag(tagName: string): string | null {
  if (tagName === "None" || tagName === "") return null;
  return tagName.replace(/^Features\./, "");
}

/**
 * The flag that still gates content. Flags the owner confirmed as released (see
 * `RELEASED_FEATURE_FLAGS`) no longer hide anything, so they resolve to null.
 */
export function resolveFeatureFlag(
  tagName: string,
  releasedFlags: ReadonlySet<string>,
): string | null {
  const flag = parseFeatureFlag(tagName);
  return flag !== null && releasedFlags.has(flag) ? null : flag;
}

const DataTableFileSchema = z
  .tuple([z.object({ Rows: z.record(z.string(), z.unknown()) })])
  .rest(z.unknown());

/** Extracts `Rows` from the exported DataTable file shape (`[ { Type, Name, Rows } ]`). */
export function parseDataTableRows(json: unknown, sourceName: string): Record<string, unknown> {
  const result = DataTableFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`${sourceName}: not a DataTable export\n${z.prettifyError(result.error)}`);
  }
  return result.data[0].Rows;
}
