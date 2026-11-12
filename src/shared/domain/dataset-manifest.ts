import { z } from "zod";

/** Describes the curated dataset in `data/processed`. Written by the pipeline, read by the app. */
export const DatasetManifestSchema = z.object({
  schemaVersion: z.literal(1),
  gameVersion: z.string().min(1),
  /** Content hash: changes only when the emitted data changes. */
  dataVersion: z.string().regex(/^[0-9a-f]{12}$/),
  counts: z.object({
    items: z.number().int().nonnegative(),
    recipes: z.number().int().nonnegative(),
    stations: z.number().int().nonnegative(),
    itemSources: z.number().int().nonnegative(),
    constructs: z.number().int().nonnegative(),
    animals: z.number().int().nonnegative(),
  }),
});

export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;
