import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMessages } from "@/shared/i18n/get-messages";
import { CategoryGrid } from "../category-grid";
import { resolveLocale } from "../resolve-locale";
import { loadRecipeCatalog } from "./recipe-catalog";

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

  const craft = categories.filter((category) => category.group === "craft");

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{recipesHub.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{recipesHub.intro}</p>
      </header>

      <Section title={recipesHub.craft.title} intro={recipesHub.craft.intro}>
        <CategoryGrid categories={craft} locale={locale} hrefFor={(id) => `/recipes/${id}`} />
      </Section>
    </div>
  );
}
