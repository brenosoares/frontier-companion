"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import { formatDuration, formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { GameIcon } from "@/shared/ui/game-icon";
import { ItemLine } from "@/shared/ui/item-line";
import { Select } from "@/shared/ui/select";
import {
  type CalculatorState,
  parseCalculatorState,
  parseQuantity,
  serializeCalculatorState,
} from "../domain/calculator-state";
import {
  buildVariantIndex,
  MAX_QUANTITY,
  type PlanStep,
  planCrafting,
  type RecipeVariant,
} from "../domain/crafting-plan";
import type { Recipe } from "../domain/recipe";

/** Display data for an item, already localized. */
export interface CalculatorItem {
  name: string;
  icon: string | null;
  /** The game data tells where this item can be found (so a raw material is not a dead end). */
  hasSource: boolean;
  /**
   * It can be gathered or bought as is. False for items that need a special process (mutated
   * crops), so the default recipe avoids them even though their origin is known.
   */
  directlyObtainable: boolean;
}

/** Only plain strings cross the server -> client boundary. */
export interface CalculatorLabels {
  item: string;
  chooseItem: string;
  quantity: string;
  empty: string;
  rawItem: string;
  materials: string;
  materialsHint: string;
  noKnownSource: string;
  steps: string;
  stepsHint: string;
  batchesOne: string;
  batchesOther: string;
  leftover: string;
  timePerBatch: string;
  instant: string;
  recipeVariant: string;
}

interface MaterialsCalculatorProps {
  recipes: readonly Recipe[];
  items: Readonly<Record<string, CalculatorItem>>;
  /** Station id -> localized name. */
  stations: Readonly<Record<string, string>>;
  locale: Locale;
  labels: CalculatorLabels;
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function MaterialsCalculator({
  recipes,
  items,
  stations,
  locale,
  labels,
}: MaterialsCalculatorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CalculatorState>(() => parseCalculatorState(searchParams));
  // The text box keeps what the user typed (e.g. an empty field) while `state` holds the valid value.
  const [quantityText, setQuantityText] = useState(() => String(state.quantity));

  const variants = useMemo(() => buildVariantIndex(recipes), [recipes]);
  const isObtainable = useCallback(
    (itemId: string) => variants.has(itemId) || items[itemId]?.directlyObtainable === true,
    [variants, items],
  );
  const nameOf = (itemId: string) => items[itemId]?.name ?? itemId;
  const itemHref = (itemId: string) => localizedPath(locale, `/items/${itemId}`);

  const craftable = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    return [...variants.keys()]
      .filter((id) => items[id])
      .sort((a, b) => collator.compare(items[a]?.name ?? a, items[b]?.name ?? b));
  }, [variants, items, locale]);

  const activeItemId = state.itemId !== null && variants.has(state.itemId) ? state.itemId : null;
  const isRawItem =
    state.itemId !== null && activeItemId === null && items[state.itemId] !== undefined;

  const plan = useMemo(
    () =>
      activeItemId === null
        ? null
        : planCrafting({
            itemId: activeItemId,
            quantity: state.quantity,
            variants,
            choices: state.choices,
            isObtainable,
          }),
    [activeItemId, state.quantity, state.choices, variants, isObtainable],
  );

  function update(patch: Partial<CalculatorState>) {
    const next = { ...state, ...patch };
    setState(next);
    const query = serializeCalculatorState(next);
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function describeVariant({ recipe }: RecipeVariant): string {
    const inputs = recipe.inputs.map((input) => `${input.amount}× ${nameOf(input.itemId)}`);
    return `${inputs.join(" + ")} → ${recipe.output.amount}× ${nameOf(recipe.output.itemId)}`;
  }

  function batchesLabel(count: number): string {
    return formatTemplate(count === 1 ? labels.batchesOne : labels.batchesOther, {
      count: formatNumber(count, locale),
    });
  }

  function renderStep(step: PlanStep) {
    const options = variants.get(step.itemId) ?? [];
    const leftover = step.produced - step.needed;
    const time =
      step.batchTimeSeconds > 0
        ? formatTemplate(labels.timePerBatch, {
            time: formatDuration(step.batchTimeSeconds, locale),
          })
        : labels.instant;
    const chosenKey = state.choices[step.itemId];
    const selectedKey = options.find((option) => option.key === chosenKey)?.key ?? step.recipeId;

    return (
      <li
        key={step.itemId}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex items-center gap-3">
          <GameIcon
            kind="item"
            icon={items[step.itemId]?.icon ?? null}
            size={32}
            className="size-10"
          />
          <p className="min-w-0 font-medium break-words">
            <span className="font-semibold">{formatNumber(step.needed, locale)}×</span>{" "}
            <Link href={itemHref(step.itemId)} className={LINK_CLASS}>
              {nameOf(step.itemId)}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span>{batchesLabel(step.batches)}</span>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            {time}
          </span>
          {step.stationIds.map((id) => (
            <Badge key={id}>{stations[id] ?? id}</Badge>
          ))}
          {leftover > 0 && (
            <span>
              {formatTemplate(labels.leftover, { count: formatNumber(leftover, locale) })}
            </span>
          )}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {step.inputs.map((input) => (
            <li key={input.itemId}>
              <ItemLine icon={items[input.itemId]?.icon ?? null} size={24}>
                {formatNumber(input.amount, locale)}× {nameOf(input.itemId)}
              </ItemLine>
            </li>
          ))}
        </ul>

        {options.length > 1 && (
          <Select
            id={`variant-${step.itemId}`}
            label={labels.recipeVariant}
            value={selectedKey}
            onChange={(event) =>
              update({ choices: { ...state.choices, [step.itemId]: event.target.value } })
            }
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {describeVariant(option)}
              </option>
            ))}
          </Select>
        )}
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Select
          id="calc-item"
          label={labels.item}
          value={activeItemId ?? ""}
          onChange={(event) => update({ itemId: event.target.value || null, choices: {} })}
        >
          <option value="">{labels.chooseItem}</option>
          {craftable.map((id) => (
            <option key={id} value={id}>
              {nameOf(id)}
            </option>
          ))}
        </Select>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="calc-quantity" className="text-sm font-medium text-muted">
            {labels.quantity}
          </label>
          <input
            id="calc-quantity"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={String(MAX_QUANTITY).length}
            value={quantityText}
            onChange={(event) => {
              const text = event.target.value.replace(/\D/g, "");
              setQuantityText(text);
              update({ quantity: parseQuantity(text) });
            }}
            onBlur={() => setQuantityText(String(state.quantity))}
            className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>
      </div>

      {isRawItem && <p className="text-muted">{labels.rawItem}</p>}
      {!plan && !isRawItem && <p className="text-muted">{labels.empty}</p>}

      {plan && (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="calc-materials">
            <div>
              <h2 id="calc-materials" className="text-xl font-semibold tracking-tight">
                {labels.materials}
              </h2>
              <p className="text-sm text-muted">{labels.materialsHint}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {plan.materials.map((material) => (
                <li
                  key={material.itemId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <GameIcon
                    kind="item"
                    icon={items[material.itemId]?.icon ?? null}
                    size={32}
                    className="size-10"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-medium break-words">
                      <span className="font-semibold">
                        {formatNumber(material.amount, locale)}×
                      </span>{" "}
                      <Link href={itemHref(material.itemId)} className={LINK_CLASS}>
                        {nameOf(material.itemId)}
                      </Link>
                    </p>
                    {!variants.has(material.itemId) &&
                      items[material.itemId]?.hasSource !== true && (
                        <Badge tone="orange" className="self-start">
                          {labels.noKnownSource}
                        </Badge>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="calc-steps">
            <div>
              <h2 id="calc-steps" className="text-xl font-semibold tracking-tight">
                {labels.steps}
              </h2>
              <p className="text-sm text-muted">{labels.stepsHint}</p>
            </div>
            <ol className="flex flex-col gap-3">{plan.steps.map(renderStep)}</ol>
          </section>
        </>
      )}
    </div>
  );
}
