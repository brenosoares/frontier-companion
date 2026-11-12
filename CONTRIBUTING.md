# Contribuindo

## Requisitos

Node (ver `.nvmrc`) e pnpm.

## Fluxo

1. `pnpm install` · `pnpm dev`
2. Branch a partir de `main`; PR obrigatório com CI verde.
3. Commits seguem **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`) — validado por commitlint.
4. Antes do PR: `pnpm check` (lint + typecheck + format + testes). E2E: `pnpm test:e2e`.

## Convenções

- Camadas: `app → features → shared` (o lint bloqueia violações).
- Cada feature: `domain/` (regras puras) → `data/` (repositórios) → `components/`.
- Tipos derivam de schemas Zod (`z.infer`); sem `any`.
- Toda entrada externa é validada. Nada de `dangerouslySetInnerHTML`.
- **Nunca** commitar dados brutos do jogo, ícones oficiais ou segredos.

## Dados do jogo

- O dump bruto fica **fora** do repo. Aponte `RAW_DATA_DIR` para a pasta que contém `FarMech/` (padrão: `../frontier-companion-data-raw`).
- `pnpm data:build` valida e gera `data/processed/` (git-ignorado). Falha se houver referência quebrada, dado malformado ou string sensível.
- Nova entidade = schema Zod em `features/<x>/domain` + extractor em `scripts/data-pipeline/extractors` + testes com fixtures sintéticas + checagem de integridade + repositório + registro em `src/app/[locale]/data.ts`. Detalhes: `docs/adr/0004-data-pipeline.md` e `0006-items-catalog.md`.

## UI e i18n

- Textos em `src/shared/i18n/messages/{pt-BR,en}.ts` (o compilador exige os dois).
- Cores: apenas tokens semânticos de `src/app/globals.css`. Variável opcional: `NEXT_PUBLIC_BMC_URL` (link do Buy Me a Coffee no footer).
- A nova entrada de menu vai em `src/app/[locale]/navigation.tsx`.
- Ícones: o `pnpm data:build` lê `icons_pixel/` (ao lado de `FarMech/`, gerado fora do repo) e publica só os usados em `public/icons/items/`. Não edite essa pasta à mão.
- Avisos do pipeline (fontes "Wip", referências a itens inexistentes, itens sem ícone) são problemas **dos dados do jogo**, não do nosso código: leia-os a cada patch.
