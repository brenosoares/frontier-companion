import { MAX_QUANTITY } from "./crafting-plan";

/** What the materials calculator lets the user change. It lives in the URL so plans are shareable. */
export interface CalculatorState {
  itemId: string | null;
  quantity: number;
  /** Item id -> chosen recipe variant key. */
  choices: Record<string, string>;
}

export const DEFAULT_CALCULATOR_STATE: CalculatorState = { itemId: null, quantity: 1, choices: {} };

const ID = /^[A-Za-z][A-Za-z0-9_]*$/;
/** `v=<itemId>:<variantKey>`, repeated once per item with a non-default variant. */
const CHOICE = /^([A-Za-z][A-Za-z0-9_]*):([A-Za-z][A-Za-z0-9_]*)$/;

/** Anything that is not a whole number in range becomes 1 (never throws, never exceeds the cap). */
export function parseQuantity(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || !/^\d+$/.test(raw.trim())) return 1;
  const value = Number(raw.trim());
  return value >= 1 && value <= MAX_QUANTITY ? value : value > MAX_QUANTITY ? MAX_QUANTITY : 1;
}

/** URL params are untrusted: malformed ids, quantities and choices fall back to defaults. */
export function parseCalculatorState(
  params: Pick<URLSearchParams, "get" | "getAll">,
): CalculatorState {
  const item = params.get("item");
  const choices: Record<string, string> = {};
  for (const raw of params.getAll("v")) {
    const match = CHOICE.exec(raw);
    if (match?.[1] && match[2]) choices[match[1]] = match[2];
  }

  return {
    itemId: item !== null && ID.test(item) ? item : null,
    quantity: parseQuantity(params.get("qty")),
    choices,
  };
}

/** Only non-default values are written, keeping URLs short. */
export function serializeCalculatorState(state: CalculatorState): string {
  const params = new URLSearchParams();
  if (state.itemId) params.set("item", state.itemId);
  if (state.quantity !== DEFAULT_CALCULATOR_STATE.quantity) {
    params.set("qty", String(state.quantity));
  }
  for (const [itemId, key] of Object.entries(state.choices).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    params.append("v", `${itemId}:${key}`);
  }
  return params.toString();
}
