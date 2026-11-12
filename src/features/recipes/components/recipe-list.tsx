import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/shared/i18n/messages/types";
import { formatDuration, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { ItemLine } from "@/shared/ui/item-line";
import type { RecipeLine, RecipeView } from "../domain/recipe-view";

interface RecipeListProps {
  recipes: readonly RecipeView[];
  locale: string;
  labels: Messages["recipes"];
  /** Builds the link of an item page (routing knowledge stays with the caller). */
  itemHref: (itemId: string) => string;
  /** The item whose page is being shown; it is rendered as plain text instead of a link. */
  currentItemId?: string;
}

export function RecipeList({ recipes, locale, labels, itemHref, currentItemId }: RecipeListProps) {
  const renderLine = (line: RecipeLine) => {
    const text = `${line.amount}× ${line.name}`;
    return (
      <ItemLine icon={line.icon}>
        {line.itemId === currentItemId ? (
          <span className="font-semibold">{text}</span>
        ) : (
          <Link
            href={itemHref(line.itemId)}
            className="rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {text}
          </Link>
        )}
      </ItemLine>
    );
  };

  return (
    <ul className="flex flex-col gap-3">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ul aria-label={labels.ingredients} className="flex flex-wrap gap-x-4 gap-y-2">
              {recipe.inputs.map((input) => (
                <li key={input.itemId}>{renderLine(input)}</li>
              ))}
            </ul>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <p>
              <span className="sr-only">{labels.produces}: </span>
              {renderLine(recipe.output)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" />
              <span className="sr-only">{labels.time}: </span>
              {recipe.timeSeconds > 0 ? formatDuration(recipe.timeSeconds, locale) : labels.instant}
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <span>{labels.stations}:</span>
              {recipe.stations.length > 0 ? (
                recipe.stations.map((station) => <Badge key={station}>{station}</Badge>)
              ) : (
                <span>{labels.noStation}</span>
              )}
            </span>
            {recipe.bookLevel > 0 && (
              <span>{formatTemplate(labels.bookLevel, { level: recipe.bookLevel })}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
