import type { Messages } from "./types";

export const en: Messages = {
  app: {
    name: "Frontier Companion",
    description: "Unofficial companion for Lightyear Frontier: items, recipes, buildings and more.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuTitle: "Navigation menu",
    mainNavigation: "Main navigation",
    languageNavigation: "Language",
    opensInNewTab: "opens in a new tab",
  },
  nav: {
    home: "Home",
  },
  search: {
    label: "Search",
    placeholder: "Search coming soon",
  },
  language: {
    "pt-BR": "Português",
    en: "English",
  },
  footer: {
    disclaimer:
      "Fan project, unofficial. Not affiliated with, endorsed or sponsored by the studio or publisher. Lightyear Frontier and its assets belong to their respective owners.",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookies: "Cookies and storage",
    support: "Buy me a coffee",
    legalNavigation: "Legal information",
    dataVersion: (gameVersion: string) => `Data extracted from game version ${gameVersion}`,
  },
  home: {
    title: "Frontier Companion",
    intro: "Your companion for Lightyear Frontier. Browse items, recipes and much more.",
    status: "Under construction",
    itemsTitle: "Items",
    recipesTitle: "Recipes",
    count: (value: number) => `${value} in the catalog`,
  },
  legal: {
    inProgress: "This document is being written and will be published before launch.",
  },
};
