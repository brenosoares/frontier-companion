import type { Recipe } from "./recipe";

export const MAX_QUANTITY = 99_999;

/**
 * A distinct way to make an item. Recipes that only differ in batch size or station (1×, 5×, 25×…)
 * need the same ingredients per unit, so they form ONE variant, represented by its smallest batch.
 */
export interface RecipeVariant {
  /** Id of the representative (smallest-batch) recipe; stable and usable in URLs. */
  key: string;
  recipe: Recipe;
}

/** Output item id -> its variants. */
export type VariantIndex = ReadonlyMap<string, readonly RecipeVariant[]>;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Ingredients per unit produced, reduced (2 of A for 4 outputs == 1 of A for 2), order-free. */
function perUnitSignature({ inputs, output }: Recipe): string {
  return inputs
    .map(({ itemId, amount }) => {
      const divisor = gcd(amount, output.amount);
      return `${itemId}:${amount / divisor}/${output.amount / divisor}`;
    })
    .sort()
    .join("|");
}

const isSmallerBatch = (a: Recipe, b: Recipe) =>
  a.output.amount - b.output.amount || a.bookLevel - b.bookLevel || a.id.localeCompare(b.id);

export function buildVariantIndex(recipes: readonly Recipe[]): VariantIndex {
  const groups = new Map<string, Map<string, Recipe>>();

  for (const recipe of recipes) {
    const signature = perUnitSignature(recipe);
    const bySignature = groups.get(recipe.output.itemId) ?? new Map<string, Recipe>();
    const best = bySignature.get(signature);
    if (!best || isSmallerBatch(recipe, best) < 0) bySignature.set(signature, recipe);
    groups.set(recipe.output.itemId, bySignature);
  }

  return new Map(
    [...groups].map(([itemId, bySignature]) => [
      itemId,
      [...bySignature.values()]
        .map((recipe): RecipeVariant => ({ key: recipe.id, recipe }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    ]),
  );
}

/**
 * Picks the variant a player can most realistically make: avoid ingredients that can neither be
 * crafted nor found (e.g. rare plants), then lower book level, then fewer ingredients per unit.
 */
export function pickDefaultVariant(
  variants: readonly RecipeVariant[],
  isObtainable: (itemId: string) => boolean,
): RecipeVariant {
  const score = ({ recipe }: RecipeVariant) => ({
    blocked: recipe.inputs.filter((input) => !isObtainable(input.itemId)).length,
    bookLevel: recipe.bookLevel,
    perUnit: recipe.inputs.reduce((sum, input) => sum + input.amount, 0) / recipe.output.amount,
  });

  const [best] = [...variants].sort((a, b) => {
    const [sa, sb] = [score(a), score(b)];
    return (
      sa.blocked - sb.blocked ||
      sa.bookLevel - sb.bookLevel ||
      sa.perUnit - sb.perUnit ||
      a.key.localeCompare(b.key)
    );
  });
  if (!best) throw new Error("pickDefaultVariant needs at least one variant");
  return best;
}

export interface PlanStep {
  itemId: string;
  recipeId: string;
  stationIds: string[];
  /** Units of the item the plan requires. */
  needed: number;
  batches: number;
  /** `batches × batch size`; the difference to `needed` is left over. */
  produced: number;
  /** Seconds per batch. */
  batchTimeSeconds: number;
  /** Total ingredients consumed by all batches. */
  inputs: { itemId: string; amount: number }[];
}

export interface PlanMaterial {
  itemId: string;
  amount: number;
}

export interface CraftingPlan {
  itemId: string;
  quantity: number;
  /** Craft in this order: dependencies first, the requested item last. Empty for raw items. */
  steps: PlanStep[];
  /** Everything that has to be gathered (items without a recipe), most needed first. */
  materials: PlanMaterial[];
}

export interface PlanRequest {
  itemId: string;
  quantity: number;
  variants: VariantIndex;
  /** Item id -> chosen variant key. Unknown choices fall back to the default variant. */
  choices?: Readonly<Record<string, string>>;
  isObtainable: (itemId: string) => boolean;
}

export function planCrafting({
  itemId,
  quantity,
  variants,
  choices = {},
  isObtainable,
}: PlanRequest): CraftingPlan {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new RangeError(`quantity must be an integer between 1 and ${MAX_QUANTITY}`);
  }

  const variantFor = (id: string): RecipeVariant | null => {
    const options = variants.get(id);
    if (!options) return null;
    return (
      options.find((option) => option.key === choices[id]) ??
      pickDefaultVariant(options, isObtainable)
    );
  };

  // Depth-first post-order: every item appears after all the items it needs.
  const postOrder: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string, path: readonly string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting")
      throw new Error(`Recipe cycle: ${[...path, id].join(" -> ")}`);

    const variant = variantFor(id);
    if (!variant) {
      state.set(id, "done");
      return;
    }
    state.set(id, "visiting");
    for (const input of variant.recipe.inputs) visit(input.itemId, [...path, id]);
    state.set(id, "done");
    postOrder.push(id);
  };
  visit(itemId, []);

  // Demand flows from the requested item down to the raw materials. Parents come first, so each
  // item's total demand (from ALL its parents) is known before its batches are rounded up once.
  const demand = new Map<string, number>([[itemId, quantity]]);
  const steps: PlanStep[] = [];
  for (const id of [...postOrder].reverse()) {
    const { recipe } = variantFor(id)!;
    const needed = demand.get(id) ?? 0;
    const batches = Math.ceil(needed / recipe.output.amount);
    const inputs = recipe.inputs.map((input) => ({
      itemId: input.itemId,
      amount: input.amount * batches,
    }));
    for (const input of inputs)
      demand.set(input.itemId, (demand.get(input.itemId) ?? 0) + input.amount);

    steps.push({
      itemId: id,
      recipeId: recipe.id,
      stationIds: recipe.stations,
      needed,
      batches,
      produced: batches * recipe.output.amount,
      batchTimeSeconds: recipe.timeSeconds,
      inputs,
    });
  }

  const crafted = new Set(postOrder);
  const materials = [...demand]
    .filter(([id]) => !crafted.has(id))
    .map(([id, amount]): PlanMaterial => ({ itemId: id, amount }))
    .sort((a, b) => b.amount - a.amount || a.itemId.localeCompare(b.itemId));

  return { itemId, quantity, steps: steps.reverse(), materials };
}
