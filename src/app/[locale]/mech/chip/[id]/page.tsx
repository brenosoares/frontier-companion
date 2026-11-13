import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { partGroup } from "@/features/mech/domain/mech";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { CostList } from "@/shared/ui/cost-list";
import { FactList } from "@/shared/ui/fact-list";
import { GameIcon } from "@/shared/ui/game-icon";
import { itemRepository, mechRepository } from "../../../data";
import { assertLocale } from "../../../resolve-locale";
import { chipCategoryId } from "../../mech-catalog";

export async function generateStaticParams() {
  const chips = await mechRepository.getChips();
  return LOCALES.flatMap((locale) => chips.map((chip) => ({ locale, id: chip.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mech/chip/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const chip = await mechRepository.getChipById(id);
  if (!chip) notFound();
  return {
    title: chip.name[locale],
    description: chip.description?.[locale] ?? getMessages(locale).app.description,
  };
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function MechChipPage({ params }: PageProps<"/[locale]/mech/chip/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { mech: text, items: itemText } = getMessages(locale);

  const chip = await mechRepository.getChipById(id);
  if (!chip) notFound();
  const itemById = new Map((await itemRepository.getAll()).map((item) => [item.id, item]));

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, "/mech")}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {text.back}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <GameIcon
            kind="mech"
            icon={chip.icon}
            size={64}
            className="size-20 border border-border"
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
              {chip.name[locale]}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge>{text.chip.kind}</Badge>
              {chip.unique && <Badge>{text.chip.unique}</Badge>}
            </div>
          </div>
        </div>

        {chip.featureFlag !== null && (
          <p
            role="note"
            className="rounded-lg border border-tone-orange/40 bg-tone-orange/15 p-3 text-sm text-tone-orange"
          >
            <strong className="mr-1">{itemText.unavailableBadge}.</strong>
            {text.chip.unavailableNote}
          </p>
        )}

        <p className="max-w-2xl text-lg text-muted">
          {chip.description?.[locale] ?? text.chip.noDescription}
        </p>
        {chip.unique && <p className="text-sm text-muted">{text.chip.uniqueNote}</p>}
      </header>

      <FactList facts={[{ label: text.chip.power, value: formatNumber(chip.powerCost, locale) }]} />

      <Section title={text.chip.cost}>
        {chip.costs.length > 0 ? (
          <CostList
            locale={locale}
            costs={chip.costs.map(({ itemId, amount }) => ({
              itemId,
              amount,
              name: itemById.get(itemId)?.name[locale] ?? itemId,
              icon: itemById.get(itemId)?.icon ?? null,
              href: localizedPath(locale, `/items/${itemId}`),
            }))}
          />
        ) : (
          <p className="text-muted">{text.chip.noCost}</p>
        )}
      </Section>

      <Section title={text.chip.fits}>
        {chip.fits.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {chip.fits.map((category) => (
              <li key={category}>
                <Link
                  href={localizedPath(locale, `/mech/category/${chipCategoryId(category)}`)}
                  className={LINK_CLASS}
                >
                  {`${text.groups[partGroup(category)]} · ${text.categories[category]}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{text.chip.noFits}</p>
        )}
      </Section>
    </article>
  );
}
