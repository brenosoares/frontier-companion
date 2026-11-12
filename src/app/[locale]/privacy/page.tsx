import type { Metadata } from "next";
import { getMessages } from "@/shared/i18n/get-messages";
import { LegalPlaceholder } from "@/shared/layout/legal-placeholder";
import { resolveLocale } from "../resolve-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  return { title: getMessages(await resolveLocale(params)).footer.privacy };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const messages = getMessages(await resolveLocale(params));
  return <LegalPlaceholder title={messages.footer.privacy} message={messages.legal.inProgress} />;
}
