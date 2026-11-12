# ADR 0013 — Seção própria para construções e decorações

- Status: aceito
- Substitui a decisão de rotas do ADR 0009 (item 10); o restante do 0009 segue valendo.

## Decisão

Construções e decorações saem de Receitas e ganham a seção **Construções** (item no menu):

- `/constructs` — hub por grupo (Construções, Decorações) e categoria do menu de construção;
- `/constructs/category/[category]` — cards da categoria (ids `constructs-*`, `decorations-*`);
- `/constructs/[id]` — detalhe.

`/recipes` passa a listar só as famílias de fabricação (`craft-*`). Os dados e a classificação das categorias não mudam (o catálogo continua único em `recipe-catalog.ts`; cada página filtra por grupo).

URLs antigas (`/recipes/constructs/[id]`, `/recipes/constructs-*`, `/recipes/decorations-*`) redirecionam com 308 em `next.config.ts`.

`category/` é um segmento estático para não colidir com `[id]`.
