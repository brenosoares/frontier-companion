# ADR 0001 — Stack

- **Status:** aceito
- **Decisão:** Next.js 16 (App Router) + React 19 + TypeScript estrito + Tailwind CSS 4, pnpm, Zod, Vitest, Playwright + axe, ESLint + Prettier, Husky + commitlint.
- **Por quê:** requisito do projeto (Next + Tailwind 4); o restante maximiza segurança de tipos, testabilidade e feedback rápido.
- **Consequências:** Next 16 tem mudanças de API (ex.: `proxy` no lugar de `middleware`, `cacheComponents`). Consultar `node_modules/next/dist/docs/` antes de usar APIs novas (ver AGENTS.md).

## Arquitetura em camadas

`app → features → shared`. Imposto por `eslint-plugin-boundaries` (ver `eslint.config.mjs`). `shared` não importa de `features`/`app`; uma feature não importa de outra.
