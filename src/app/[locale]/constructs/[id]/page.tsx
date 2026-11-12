import { ArrowLeft, Coins, Sofa } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { constructGroup } from "@/features/constructs/domain/construct";
import { LOCALES, localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { GameIcon } from "@/shared/ui/game-icon";
import { constructRepository, itemRepository } from "../../data";
import { assertLocale } from "../../resolve-locale";

export async function generateStaticParams() {
  const constructs = await constructRepository.getAll();
  return LOCALES.flatMap((locale) => constructs.map((construct) => ({ locale, id: construct.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/constructs/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const construct = await constructRepository.getById(id);
  if (!construct) notFound();

  return {
    title: construct.name[locale],
    description: construct.description?.[locale] ?? getMessages(locale).app.description,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function ConstructPage({ params }: PageProps<"/[locale]/constructs/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const { constructPage: text, recipesHub, items: itemText } = getMessages(locale);

  const construct = await constructRepository.getById(id);
  if (!construct) notFound();
  const items = new Map((await itemRepository.getAll()).map((item) => [item.id, item]));

  const categoryLabel = recipesHub.categories[construct.category];
  const groupLabel = recipesHub.groups[constructGroup(construct.category)];

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <Link
        href={localizedPath(locale, `/constructs/category/${construct.category}`)}
        className="inline-flex items-center gap-2 self-start rounded text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {formatTemplate(text.back, { category: categoryLabel })}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <GameIcon
            kind="construct"
            icon={construct.icon}
            size={64}
            className="size-20 border border-border"
          />
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {construct.name[locale]}
          </h1>
        </div>

        {construct.featureFlag !== null && (
          <p
            role="note"
            className="rounded-lg border border-tone-orange/40 bg-tone-orange/15 p-3 text-sm text-tone-orange"
          >
            <strong className="mr-1">{itemText.unavailableBadge}.</strong>
            {text.unavailableNote}
          </p>
        )}

        <p className="max-w-2xl text-lg text-muted">
          {construct.description?.[locale] ?? text.noDescription}
        </p>

        <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <dt className="text-sm text-muted">{text.category}</dt>
            <dd>
              <Badge>{`${groupLabel} · ${categoryLabel}`}</Badge>
            </dd>
          </div>
          {construct.coziness > 0 && (
            <div className="flex items-center gap-2">
              <Sofa aria-hidden="true" className="size-5 text-muted" />
              <dt className="text-sm text-muted">{text.coziness}</dt>
              <dd className="font-semibold">{formatNumber(construct.coziness, locale)}</dd>
            </div>
          )}
        </dl>
      </header>

      <Section title={text.cost}>
        {construct.costs.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {construct.costs.map(({ itemId, amount }) => (
              <li
                key={itemId}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <GameIcon
                  kind="item"
                  icon={items.get(itemId)?.icon ?? null}
                  size={32}
                  className="size-10"
                />
                <p className="min-w-0 font-medium break-words">
                  <span className="font-semibold">{formatNumber(amount, locale)}×</span>{" "}
                  <Link
                    href={localizedPath(locale, `/items/${itemId}`)}
                    className="rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {items.get(itemId)?.name[locale] ?? itemId}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{text.noCost}</p>
        )}
      </Section>

      <Section title={text.obtain}>
        <ul className="flex flex-col gap-2">
          <li>{text.buildMode}</li>
          <li className="flex items-start gap-2 text-muted">
            <Coins aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {construct.blueprintPrice !== null
              ? formatTemplate(text.blueprintSold, {
                  price: formatNumber(construct.blueprintPrice, locale),
                })
              : text.noBlueprint}
          </li>
        </ul>
      </Section>
    </article>
  );
}
