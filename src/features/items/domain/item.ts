import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

const PascalCaseId = z.string().regex(/^[A-Z][A-Za-z0-9]*$/);

export const ItemSchema = z.object({
  /** Stable game id (DataTable row name), e.g. "AdvancedFuel1". */
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: LocalizedTextSchema,
  description: LocalizedTextSchema.nullable(),
  tags: z.array(PascalCaseId),
  weight: z.number().int().nonnegative(),
  sellValue: z.number().int().nonnegative(),
  /** Icon file name without extension, served at `/icons/items/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  /** Game feature flag gating this item, or null when ungated. */
  featureFlag: z.string().nullable(),
  isVirtual: z.boolean(),
});

export type Item = z.infer<typeof ItemSchema>;
