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
