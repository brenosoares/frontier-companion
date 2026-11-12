# ADR 0006 — Catálogo de itens e composição de dados (Fase 4, 1ª fatia)

- **Status:** aceito

## Decisões

1. **Estações viram entidade** (`Station`, 29 registros): nomes localizados vêm de `DT_Constructs`. As 3 estações `SeedRefinement*` (máquina do NPC Ulf, não é construção) têm nome manual em `config.ts`, baseado no texto do jogo. A integridade valida `recipe.stations ⊂ stations`.
2. **Composition root em `src/app/[locale]/data.ts`.** É o único lugar que conhece os JSONs; features dependem só das interfaces de repositório. Os JSONs são importados estaticamente (bundle, sem I/O em runtime — compatível com `cacheComponents`) via alias `@data/*`, e continuam validados por Zod na primeira leitura.
3. **Features não se importam.** `items` e `recipes` se encontram na página (camada `app`), que resolve ids → nomes e passa _view models_ (`RecipeView`) para os componentes. A resolução é injetada (`RecipeNameResolver`), então o mapeamento é puro e testável.
4. **Catálogo filtrado no cliente.** São 285 itens: cada entrada é um `ItemListEntry` enxuto e já localizado (~poucos KB), então busca/filtro/ordenação são instantâneos e a página continua estática. O estado (`q`, `tag`, `sort`, `unavailable`) vive na URL (compartilhável), é validado (valores inválidos viram padrão, `q` limitada a 100 caracteres) e espelhado via `history.replaceState`.
5. **Busca sem acento e bilíngue:** casa palavras em nome en + pt-BR + id (quem navega em português acha "copper ore").
6. **Busca do header** é um `<form method="get">` para `/items?q=` — funciona sem JS e reaproveita o filtro do catálogo. Quando houver mais entidades pesquisáveis, vira uma página de busca própria.
7. **Conteúdo com feature flag** fica oculto por padrão no catálogo (decisão do dono), com toggle "Mostrar conteúdo possivelmente indisponível". A página de detalhe continua acessível e avisa. O texto é deliberadamente cauteloso ("possivelmente indisponível"): o dump não diz quais flags estão ativas.
8. **Categorias (tags) têm rótulos nossos** em `messages.items.tags`. A tag interna `StaticPricing` é escondida (133 itens; não significa nada para o jogador). Um teste falha se o dataset trouxer tag sem rótulo em algum idioma — um patch novo obriga a traduzir.
9. **`partialPrefetching: false` explícito.** Com ele ligado (padrão do scaffold), caminhos dinâmicos não pré-gerados (ex.: `/items/Inexistente`) respondem **200** (soft 404). Desligado, respondem **404** de verdade. A opção só afeta o prefetch de links. Reavaliar quando o Next a tornar obrigatória.
10. **Dados para client components:** apenas strings/objetos simples (funções não cruzam a fronteira servidor→cliente). Mensagens com função (`dataVersion`) ficam em componentes de servidor; os rótulos do explorer usam `{count}` + `formatTemplate`.
11. **Ícones continuam placeholders** (gate legal). O ícone do item (`icon`) já está nos dados, pronto para quando o gate permitir.

## Consequências

- Cada nova entidade segue o mesmo molde: schema → extractor → integridade → repositório → view model → componentes → página.
- ~570 páginas de item são pré-geradas (285 × 2 idiomas).
