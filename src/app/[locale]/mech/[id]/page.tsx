import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatStatValue } from "@/features/mech/domain/format-stat";
import { partGroup } from "@/features/mech/domain/mech";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { CostList } from "@/shared/ui/cost-list";
import { FactList } from "@/shared/ui/fact-list";
import { GameIcon } from "@/shared/ui/game-icon";
import { itemRepository, mechRepository } from "../../data";
import { assertLocale } from "../../resolve-locale";
import { chipCategoryId } from "../mech-catalog";

export async function generateStaticParams() {
  const parts = await mechRepository.getParts();
  return LOCALES.flatMap((locale) => parts.map((part) => ({ locale, id: part.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mech/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const part = await mechRepository.getPartById(id);
  if (!part) notFound();
  return {
    title: part.name[locale],
    description: part.description?.[locale] ?? getMessages(locale).app.description,
  };
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const NAV_CLASS =
  "inline-flex items-center gap-2 rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function MechPartPage({ params }: PageProps<"/[locale]/mech/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { mech: text, items: itemText } = getMessages(locale);

  const part = await mechRepository.getPartById(id);
  if (!part) notFound();
  const [items, stats, parts, chips] = await Promise.all([
    itemRepository.getAll(),
    mechRepository.getStats(),
    mechRepository.getParts(),
    mechRepository.getChips(),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const statById = new Map(stats.map((stat) => [stat.id, stat]));

  const sameCategory = parts.filter((candidate) => candidate.category === part.category);
  const previous = sameCategory.find((candidate) => candidate.tier === part.tier - 1);
  const next = sameCategory.find((candidate) => candidate.tier === part.tier + 1);
  const fittingChips = chips.filter((chip) => chip.fits.includes(part.category));
  const categoryLabel = text.categories[part.category];

  const facts = part.stats.flatMap(({ stat, value }) => {
    const known = statById.get(stat);
    return known
      ? [{ label: known.name[locale], value: formatStatValue(known.kind, value, locale, text.yes) }]
      : [];
  });

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, `/mech/category/${part.category}`)}
        className={`${NAV_CLASS} self-start`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {categoryLabel}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <GameIcon
            kind="mech"
            icon={part.icon}
            size={64}
            className="size-20 border border-border"
          />
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {part.name[locale]}
          </h1>
        </div>

        {part.featureFlag !== null && (
          <p
            role="note"
            className="rounded-lg border border-tone-orange/40 bg-tone-orange/15 p-3 text-sm text-tone-orange"
          >
            <strong className="mr-1">{itemText.unavailableBadge}.</strong>
            {text.part.unavailableNote}
          </p>
        )}

        <p className="max-w-2xl text-lg text-muted">
          {part.description?.[locale] ?? text.part.noDescription}
        </p>

        <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <dt className="text-sm text-muted">{text.part.category}</dt>
            <dd>
              <Badge>{`${text.groups[partGroup(part.category)]} · ${categoryLabel}`}</Badge>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dd className="font-semibold">
              {formatTemplate(text.part.tier, {
                tier: formatNumber(part.tier, locale),
                total: formatNumber(sameCategory.length, locale),
              })}
            </dd>
          </div>
        </dl>
      </header>

      {facts.length > 0 && (
        <Section title={text.part.stats}>
          <FactList facts={facts} />
        </Section>
      )}

      <Section title={text.part.cost}>
        {part.costs.length > 0 ? (
          <CostList
            locale={locale}
            costs={part.costs.map(({ itemId, amount }) => ({
              itemId,
              amount,
              name: itemById.get(itemId)?.name[locale] ?? itemId,
              icon: itemById.get(itemId)?.icon ?? null,
              href: localizedPath(locale, `/items/${itemId}`),
            }))}
          />
        ) : (
          <p className="text-muted">{text.part.noCost}</p>
        )}
      </Section>

      <Section title={text.part.chips}>
        {fittingChips.length > 0 ? (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {fittingChips.slice(0, 12).map((chip) => (
                <li key={chip.id} className="flex items-center gap-2">
                  <GameIcon kind="mech" icon={chip.icon} size={24} className="size-8" />
                  <Link
                    href={localizedPath(locale, `/mech/chip/${chip.id}`)}
                    className={LINK_CLASS}
                  >
                    {chip.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm">
              <Link
                href={localizedPath(locale, `/mech/category/${chipCategoryId(part.category)}`)}
                className={LINK_CLASS}
              >
                {formatTemplate(text.part.allChips, { part: categoryLabel })}
              </Link>
            </p>
          </>
        ) : (
          <p className="text-muted">{text.part.noChips}</p>
        )}
      </Section>

      {(previous || next) && (
        <nav className="flex flex-wrap justify-between gap-4" aria-label={categoryLabel}>
          {previous ? (
            <Link href={localizedPath(locale, `/mech/${previous.id}`)} className={NAV_CLASS}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              {text.part.previous}: {previous.name[locale]}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={localizedPath(locale, `/mech/${next.id}`)} className={NAV_CLASS}>
              {text.part.next}: {next.name[locale]}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
