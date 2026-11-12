import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { resolveLocale } from "../resolve-locale";
import { type CategoryGroup, type CategorySummary, loadRecipeCatalog } from "./recipe-catalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/recipes">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).recipesHub.title };
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted">{intro}</p>
      </div>
      {children}
    </section>
  );
}

export default async function RecipesPage({ params }: PageProps<"/[locale]/recipes">) {
  const locale = await resolveLocale(params);
  const { recipesHub } = getMessages(locale);
  const { categories } = await loadRecipeCatalog(locale);

  const inGroup = (group: CategoryGroup) => categories.filter((c) => c.group === group);

  const tile = (category: CategorySummary) => {
    const hidden = category.total - category.available;
    const count = category.available === 1 ? recipesHub.itemCount.one : recipesHub.itemCount.other;
    return (
      <li key={category.id}>
        <Link
          href={localizedPath(locale, `/recipes/${category.id}`)}
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
  };

  const grid = (list: readonly CategorySummary[]) => (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(tile)}</ul>
  );

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{recipesHub.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{recipesHub.intro}</p>
      </header>

      <Section title={recipesHub.build.title} intro={recipesHub.build.intro}>
        <div className="flex flex-col gap-6">
          {(["constructs", "decorations"] as const).map((group) => (
            <div key={group} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{recipesHub.groups[group]}</h3>
              {grid(inGroup(group))}
            </div>
          ))}
        </div>
      </Section>

      <Section title={recipesHub.craft.title} intro={recipesHub.craft.intro}>
        {grid(inGroup("craft"))}
      </Section>
    </div>
  );
}
