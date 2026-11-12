/** Source of truth for the message shape. `en.ts` must match it (enforced by the `Messages` type). */
export const ptBR = {
  app: {
    name: "Frontier Companion",
    description:
      "Companheiro não oficial para Lightyear Frontier: itens, receitas, construções e mais.",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    menuTitle: "Menu de navegação",
    mainNavigation: "Navegação principal",
    languageNavigation: "Idioma",
    opensInNewTab: "abre em nova aba",
  },
  nav: {
    home: "Início",
  },
  search: {
    label: "Buscar",
    placeholder: "Busca em breve",
  },
  language: {
    "pt-BR": "Português",
    en: "English",
  },
  footer: {
    disclaimer:
      "Projeto de fãs, não oficial. Não é afiliado, endossado ou patrocinado pelo estúdio ou pela publisher. Lightyear Frontier e seus ativos pertencem aos seus respectivos donos.",
    privacy: "Política de Privacidade",
    terms: "Termos de Uso",
    cookies: "Cookies e armazenamento",
    support: "Me pague um café",
    legalNavigation: "Informações legais",
    dataVersion: (gameVersion: string) => `Dados extraídos da versão ${gameVersion} do jogo`,
  },
  home: {
    title: "Frontier Companion",
    intro: "Seu companheiro para Lightyear Frontier. Consulte itens, receitas e muito mais.",
    status: "Em construção",
    itemsTitle: "Itens",
    recipesTitle: "Receitas",
    count: (value: number) => `${value} no catálogo`,
  },
  legal: {
    inProgress: "Este documento está em elaboração e será publicado antes do lançamento.",
  },
};
