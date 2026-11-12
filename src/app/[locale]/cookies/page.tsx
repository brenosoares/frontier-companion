import type { Metadata } from "next";
import { getMessages } from "@/shared/i18n/get-messages";
import { LegalPlaceholder } from "@/shared/layout/legal-placeholder";
import { resolveLocale } from "../resolve-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).footer.cookies };
}

export default async function CookiesPage({ params }: PageProps<"/[locale]/cookies">) {
  const messages = getMessages(await resolveLocale(params));
  return <LegalPlaceholder title={messages.footer.cookies} message={messages.legal.inProgress} />;
}
