import type { Metadata } from "next";
import { getMessages } from "@/shared/i18n/get-messages";
import { CategoryGrid } from "../category-grid";
import { resolveLocale } from "../resolve-locale";
import { loadMechCatalog, type MechGroup } from "./mech-catalog";

const GROUPS: readonly MechGroup[] = ["body", "tools", "transform", "chips"];

export async function generateMetadata({ params }: PageProps<"/[locale]/mech">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).mech.title };
}

export default async function MechPage({ params }: PageProps<"/[locale]/mech">) {
  const locale = await resolveLocale(params);
  const { mech: text } = getMessages(locale);
  const { categories } = await loadMechCatalog(locale);

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{text.intro}</p>
      </header>

      {GROUPS.map((group) => (
        <section key={group} className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{text.groups[group]}</h2>
            <p className="text-muted">{text.groupIntros[group]}</p>
          </div>
          <CategoryGrid
            categories={categories.filter((category) => category.group === group)}
            locale={locale}
            hrefFor={(id) => `/mech/category/${id}`}
          />
        </section>
      ))}
    </div>
  );
}
