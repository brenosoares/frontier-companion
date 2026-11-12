import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** A crafting station (machine/tier) that recipes are made in. */
export const StationSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: LocalizedTextSchema,
});

export type Station = z.infer<typeof StationSchema>;
