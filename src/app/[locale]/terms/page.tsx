import type { Metadata } from "next";
import { getMessages } from "@/shared/i18n/get-messages";
import { LegalPlaceholder } from "@/shared/layout/legal-placeholder";
import { resolveLocale } from "../resolve-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).footer.terms };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const messages = getMessages(await resolveLocale(params));
  return <LegalPlaceholder title={messages.footer.terms} message={messages.legal.inProgress} />;
}
