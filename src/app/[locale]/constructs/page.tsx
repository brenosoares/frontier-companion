import type { Metadata } from "next";
import { getMessages } from "@/shared/i18n/get-messages";
import { CategoryGrid } from "../category-grid";
import { resolveLocale } from "../resolve-locale";
import { loadRecipeCatalog } from "../recipes/recipe-catalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/constructs">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).constructsHub.title };
}

export default async function ConstructsPage({ params }: PageProps<"/[locale]/constructs">) {
  const locale = await resolveLocale(params);
  const { constructsHub, recipesHub } = getMessages(locale);
  const { categories } = await loadRecipeCatalog(locale);

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{constructsHub.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{constructsHub.intro}</p>
      </header>

      {(["constructs", "decorations"] as const).map((group) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">{recipesHub.groups[group]}</h2>
          <CategoryGrid
            categories={categories.filter((category) => category.group === group)}
            locale={locale}
            hrefFor={(id) => `/constructs/category/${id}`}
          />
        </section>
      ))}
    </div>
  );
}
