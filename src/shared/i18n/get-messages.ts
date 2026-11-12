import type { Locale } from "./config";
import { en } from "./messages/en";
import { ptBR } from "./messages/pt-BR";
import type { Messages } from "./messages/types";

const MESSAGES: Record<Locale, Messages> = { "pt-BR": ptBR, en };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
