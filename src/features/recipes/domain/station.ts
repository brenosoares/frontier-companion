import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** A crafting station (machine/tier) that recipes are made in. */
export const StationSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: LocalizedTextSchema,
  /** Machine family shared by its tiers (e.g. Furnace, Furnace II, Furnace III -> `Furnace`). */
  family: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
});

export type Station = z.infer<typeof StationSchema>;
