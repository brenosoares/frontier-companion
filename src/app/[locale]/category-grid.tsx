import Link from "next/link";
import type { Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import type { CategorySummary } from "./recipes/recipe-catalog";

interface CategoryGridProps {
  categories: readonly CategorySummary[];
  locale: Locale;
  /** Where a category lives, e.g. `/recipes/craft-Furnace`. */
  hrefFor: (categoryId: string) => string;
}

/** Tiles that lead to a category (name, how many entries, how many are possibly unavailable). */
export function CategoryGrid({ categories, locale, hrefFor }: CategoryGridProps) {
  const { recipesHub } = getMessages(locale);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const hidden = category.total - category.available;
        const count =
          category.available === 1 ? recipesHub.itemCount.one : recipesHub.itemCount.other;
        return (
          <li key={category.id}>
            <Link
              href={localizedPath(locale, hrefFor(category.id))}
              className="flex h-full flex-col gap-1 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="font-medium">{category.label}</span>
              <span className="text-sm text-muted">
                {formatTemplate(count, { count: formatNumber(category.available, locale) })}
              </span>
              {hidden > 0 && (
                <span className="text-sm text-muted">
                  {formatTemplate(recipesHub.hiddenCount, { count: formatNumber(hidden, locale) })}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
