import Link from "next/link";
import { localizedPath } from "@/shared/i18n/config";
import { datasetManifest } from "@/shared/data/dataset-manifest";
import { getMessages } from "@/shared/i18n/get-messages";
import { Badge } from "@/shared/ui/badge";
import { Card, CardDescription, CardTitle } from "@/shared/ui/card";
import { resolveLocale } from "./resolve-locale";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const messages = getMessages(locale);
  const { home } = messages;

  const stats = [
    {
      title: home.itemsTitle,
      count: datasetManifest.counts.items,
      href: localizedPath(locale, "/items"),
    },
    {
      title: home.recipesTitle,
      count: datasetManifest.counts.recipes,
      href: localizedPath(locale, "/recipes"),
    },
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Badge tone="orange" className="self-start">
          {home.status}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{home.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{home.intro}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {stats.map(({ title, count, href }) => (
          <Card
            key={title}
            className={href ? "relative transition-colors hover:bg-surface-hover" : ""}
          >
            <CardTitle>
              {href ? (
                <Link
                  href={href}
                  className="rounded after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {title}
                </Link>
              ) : (
                title
              )}
            </CardTitle>
            <CardDescription>{home.count(count)}</CardDescription>
          </Card>
        ))}
      </section>
    </div>
  );
}
