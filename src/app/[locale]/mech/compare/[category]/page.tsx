import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { comparisonRows, costAmount, statValue } from "@/features/mech/domain/compare";
import { formatStatValue } from "@/features/mech/domain/format-stat";
import { PART_CATEGORIES, type PartCategory, partGroup } from "@/features/mech/domain/mech";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { GameIcon } from "@/shared/ui/game-icon";
import { itemRepository, mechRepository } from "../../../data";
import { assertLocale } from "../../../resolve-locale";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => PART_CATEGORIES.map((category) => ({ locale, category })));
}

const isPartCategory = (value: string): value is PartCategory =>
  (PART_CATEGORIES as readonly string[]).includes(value);

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mech/compare/[category]">): Promise<Metadata> {
  const { locale: rawLocale, category } = await params;
  const locale = assertLocale(rawLocale);
  if (!isPartCategory(category)) notFound();
  const { mech } = getMessages(locale);
  return { title: formatTemplate(mech.compare.title, { part: mech.categories[category] }) };
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default async function MechComparePage({
  params,
}: PageProps<"/[locale]/mech/compare/[category]">) {
  const { locale: rawLocale, category } = await params;
  const locale = assertLocale(rawLocale);
  if (!isPartCategory(category)) notFound();
  const { mech: text } = getMessages(locale);

  const [items, stats, allParts] = await Promise.all([
    itemRepository.getAll(),
    mechRepository.getStats(),
    mechRepository.getParts(),
  ]);
  const parts = allParts
    .filter((part) => part.category === category)
    .sort((a, b) => a.tier - b.tier);
  if (parts.length === 0) notFound();

  const itemById = new Map(items.map((item) => [item.id, item]));
  const statById = new Map(stats.map((stat) => [stat.id, stat]));
  const { statIds, costItemIds } = comparisonRows(parts);
  const label = text.categories[category];
  const empty = <span aria-label={text.compare.none}>—</span>;

  const cellClass = "p-3 align-top whitespace-nowrap";
  const headClass = "p-3 text-left align-bottom font-semibold";

  return (
    <div className="flex max-w-full flex-col gap-6">
      <Link
        href={localizedPath(locale, `/mech/category/${category}`)}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {label}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">{text.groups[partGroup(category)]}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {formatTemplate(text.compare.title, { part: label })}
        </h1>
        <p className="max-w-2xl text-muted">{text.compare.intro}</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {formatTemplate(text.compare.title, { part: label })}
          </caption>
          <thead className="bg-surface-hover">
            <tr>
              <th scope="col" className={headClass}>
                {text.compare.attribute}
              </th>
              {parts.map((part) => (
                <th key={part.id} scope="col" className={headClass}>
                  <Link
                    href={localizedPath(locale, `/mech/${part.id}`)}
                    className={`${LINK_CLASS} flex flex-col items-start gap-2`}
                  >
                    <GameIcon kind="mech" icon={part.icon} size={32} className="size-10" />
                    <span>{part.name[locale]}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statIds.map((statId) => {
              const stat = statById.get(statId);
              if (!stat) return null;
              return (
                <tr key={statId} className="border-t border-border">
                  <th scope="row" className={`${cellClass} text-left font-medium`}>
                    {stat.name[locale]}
                  </th>
                  {parts.map((part) => {
                    const value = statValue(part, statId);
                    return (
                      <td key={part.id} className={cellClass}>
                        {value === null
                          ? empty
                          : formatStatValue(stat.kind, value, locale, text.yes)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {costItemIds.length > 0 && (
              <tr className="border-t-2 border-border-strong bg-surface-hover">
                <th
                  scope="colgroup"
                  colSpan={parts.length + 1}
                  className="p-3 text-left font-semibold"
                >
                  {text.compare.cost}
                </th>
              </tr>
            )}
            {costItemIds.map((itemId) => (
              <tr key={itemId} className="border-t border-border">
                <th scope="row" className={`${cellClass} text-left font-medium`}>
                  <Link href={localizedPath(locale, `/items/${itemId}`)} className={LINK_CLASS}>
                    {itemById.get(itemId)?.name[locale] ?? itemId}
                  </Link>
                </th>
                {parts.map((part) => {
                  const amount = costAmount(part, itemId);
                  return (
                    <td key={part.id} className={cellClass}>
                      {amount === null ? empty : `${formatNumber(amount, locale)}×`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
