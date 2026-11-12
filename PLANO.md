# Frontier Companion — Plano de Execução

Game companion para **Lightyear Frontier**, feito com Next.js + Tailwind 4, alimentado por JSONs extraídos do jogo (datamining).

> Este documento é vivo: ao concluir cada fase, marcamos os checkboxes e registramos decisões em `docs/adr/`.

---

## 0. Princípios (valem para todas as fases)

| Princípio                  | Como aplicamos                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **SOLID**                  | Módulos com responsabilidade única; dependência de interfaces (ex.: `ItemRepository`), não de implementações (JSON hoje, API/DB amanhã). |
| **DRY**                    | Schemas Zod são a única fonte de verdade dos tipos (`z.infer`). Componentes de UI reutilizáveis; nada de lógica duplicada entre páginas. |
| **Clean Code**             | Nomes expressivos, funções pequenas, sem `any`, sem comentários que explicam código ruim.                                                |
| **YAGNI / KISS**           | Começamos estático e sem backend. Só adicionamos contas/banco se uma feature exigir.                                                     |
| **Segurança por padrão**   | Menor privilégio, validação de toda entrada, zero dados pessoais desnecessários.                                                         |
| **Privacidade por design** | Coletar o mínimo; local-first; analytics sem cookies.                                                                                    |
| **Definition of Done**     | Lint + typecheck + testes verdes, sem vulnerabilidade alta, acessível (axe), PR revisado.                                                |

---

## 1. Decisões de arquitetura propostas

**Stack**

- Next.js (App Router, versão estável atual) + React + TypeScript `strict`
- Tailwind CSS 4 (config via CSS `@theme`, sem `tailwind.config.js`)
- pnpm, Node LTS fixado em `.nvmrc` / `engines`
- Zod (validação), Vitest + Testing Library (unit/integração), Playwright (E2E), axe (a11y)
- ESLint + Prettier (ou Biome), `eslint-plugin-boundaries` para impor camadas
- Deploy: Vercel (ou Cloudflare Pages) · CI: GitHub Actions
- i18n: `next-intl` (pt-BR e en desde o início — mais barato do que retrofitar)

**Estratégia de dados (decisão central):** _static-first_.
Os JSONs brutos passam por um **pipeline de build** que valida, normaliza e gera dados tipados. O site é majoritariamente SSG, sem banco e sem API pública → superfície de ataque mínima, custo ~zero, ótimo desempenho.

**Estrutura de pastas (feature-based, com camadas)**

```
data/
  raw/            # JSONs originais do datamining (NÃO servidos ao cliente)
  processed/      # saída do pipeline (gerado, versionado ou em build)
scripts/
  data-pipeline/  # ingest → validate → normalize → emit
src/
  app/            # rotas (finas: só composição)
  features/
    items/ crafting/ ...
      domain/         # tipos, regras puras (sem React, sem I/O)
      data/           # repositórios (implementam interfaces do domain)
      components/     # UI da feature
      hooks/
  shared/
    ui/               # design system (Button, Card, Table...)
    lib/              # utils puros
    config/
  i18n/
docs/
  adr/                # Architecture Decision Records
  legal/              # rascunhos de políticas
```

Regra de dependência: `app → features → shared`; `domain` não importa nada de fora. Imposto via lint.

---

## 2. Fases

### Fase 0 — Descoberta e fundamentos legais _(antes de escrever código)_

Objetivo: saber **o que** podemos publicar e **o que** o produto faz.

- [ ] Inventariar os JSONs: lista de arquivos, tamanho, estrutura, relações (IDs cruzados), campos sensíveis/lixo (paths locais, usernames, tokens, strings de debug).
- [ ] Mapear o que os dados cobrem → definir o escopo do MVP (ex.: itens, receitas, mechs, planetas, upgrades, culturas).
- [ ] **Análise de propriedade intelectual** (ver §4): ler EULA/ToS da Steam e do estúdio (Frontier Pillar), procurar _fan content / community policy_. Decidir o que republicamos: dados numéricos/textos x **assets gráficos** (ícones/modelos — maior risco; preferir não redistribuir sem permissão).
- [ ] Definir se haverá **conta de usuário** (recomendação: não no MVP; progresso salvo em `localStorage`/exportável).
- [ ] Definir licença do código (já há `LICENSE`; revisar se serve) e do conteúdo (dados do jogo ≠ nossa licença).
- [ ] Escrever `docs/adr/0001-stack.md` e `0002-static-first-data.md`.

**Entrega:** escopo do MVP, mapa de dados, parecer de riscos legais, ADRs iniciais.

---

### Fase 1 — Scaffold e qualidade de código

- [x] `create-next-app` (TS, App Router, Tailwind 4, ESLint, `src/`), pnpm.
- [x] TS `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- [x] ESLint (+ regras de boundaries/imports), Prettier, EditorConfig.
- [x] Husky + lint-staged + commitlint (Conventional Commits).
- [x] Vitest + Playwright + axe configurados com 1 teste de exemplo cada.
- [x] Validação de env vars com Zod (`src/shared/config/env.ts`) — falha no boot se faltar algo.
- [x] **CI** (GitHub Actions): install com `--frozen-lockfile` → lint → typecheck → test → build. Permissões mínimas do `GITHUB_TOKEN`.
- [x] `CONTRIBUTING.md`, templates de PR/issue. (`CODEOWNERS`: pendente — precisa do usuário GitHub.)
- [ ] Branch protection em `main` (PR + CI obrigatório) — pendente: depende de criar o remoto no GitHub.

**Entrega:** repo rodando, CI verde, convenções documentadas.

> ✅ Concluída localmente. `pnpm check`, build e E2E (axe + headers) passam. CI ainda não executou (sem remoto).

---

### Fase 2 — Pipeline de dados (a espinha dorsal)

Objetivo: transformar JSON bruto em dados **confiáveis e tipados**.

> **Estado:** infraestrutura completa + **primeira fatia (itens e receitas)**. As demais entidades entram **sob demanda**, uma por feature da Fase 4, repetindo o mesmo molde (schema → extractor → testes → integridade → repositório). Ver [ADR 0004](docs/adr/0004-data-pipeline.md).

- [x] Schemas Zod em `features/*/domain` — feitos: `Item`, `Recipe`. Demais entidades: sob demanda (Fase 4).
- [x] `pnpm data:build`: lê `RAW_DATA_DIR`, **valida** (erro nomeia a linha), **sanitiza** (scanner de paths/e-mails/URLs que quebra o build), **normaliza** (sufixos GUID, enums, FText → `{en, pt-BR}`, ícone/feature flag).
- [x] **Integridade referencial** (receita → item existente, ids duplicados, estação → receita).
- [x] Emite `data/processed/{items,recipes,manifest}.json` — **nosso JSON curado, versionado no repo** (o dump bruto nunca entra).
- [x] `gameVersion` (1.0.2571) + `dataVersion` (hash de conteúdo, determinístico).
- [ ] Changelog automático entre versões (diff de datamining) — adiado: só faz sentido quando houver um 2º dump para comparar.
- [x] `ItemRepository`/`RecipeRepository` + `JsonItemRepository`/`JsonRecipeRepository` (sobre `JsonCollection` genérico: DRY).
- [x] Testes: 62 no total (unit com fixtures **sintéticas**, integração do pipeline em memória, contrato contra a saída real quando existir).
- [x] Passo de CI de dados: teste de contrato sobre o JSON **commitado** (schemas, integridade, strings sensíveis, versão) roda no CI; o pipeline é validado com fixtures sintéticas. O dump real só existe localmente (`pnpm data:build`).
- [ ] Ícones: processamento (PNG → WebP/AVIF) **adiado** — depende do gate legal. A saída só referencia o nome do ícone.

**Entrega:** `pnpm data:build` gera dados validados; erros de dado quebram o build do pipeline.

---

### Fase 3 — Design system e layout base

- [ ] Tokens no `@theme` do Tailwind 4 (cores, tipografia, espaçamento, raios), tema claro/escuro.
- [ ] Componentes primitivos em `shared/ui` (Button, Card, Badge, Input, Table, Tabs, Dialog, Tooltip) — acessíveis (Radix/shadcn como base é aceitável).
- [ ] Layout: header, navegação, footer (com links legais e disclaimer — ver Fase 7), responsivo mobile-first.
- [ ] i18n estruturado (pt-BR/en), seletor de idioma, textos fora dos componentes.
- [ ] Storybook (opcional) ou página interna de catálogo de componentes.
- [ ] Acessibilidade: foco visível, contraste AA, navegação por teclado, `prefers-reduced-motion`.

---

### Fase 4 — Features do MVP (ciclos curtos, uma feature por vez)

Cada feature segue o mesmo molde: **domain → repository → UI → testes → a11y → PR**.

1. [ ] **Catálogo/Enciclopédia** — lista com busca, filtros, ordenação; página de detalhe (`generateStaticParams`).
2. [ ] **Busca global** — índice gerado em build (ex.: FlexSearch/MiniSearch), client-side.
3. [ ] **Receitas / Crafting** — árvore de dependências, cálculo de materiais totais (função pura, 100% testada).
4. [ ] **Calculadoras** (ex.: rendimento, tempo, custo) — lógica no `domain`, UI burra.
5. [ ] **Comparador** de itens/upgrades.
6. [ ] **Checklist de progresso** — persistência local (ver Fase 6).
7. [ ] **Changelog por patch** (usa o diff da Fase 2).

> A lista exata depende do mapa de dados da Fase 0. Priorizamos por valor ao jogador × esforço.

---

### Fase 5 — SEO, performance e PWA

- [ ] Metadata API, Open Graph, `sitemap.xml`, `robots.txt`, dados estruturados.
- [ ] Imagens via `next/image`; fontes via `next/font`.
- [ ] Orçamento de performance (Lighthouse CI ≥ 90; LCP/INP/CLS verdes).
- [ ] Minimizar JS cliente (Server Components por padrão; `"use client"` só onde há interação).
- [ ] PWA/offline (opcional): service worker para consultar dados sem rede.

---

### Fase 6 — Estado do usuário (local-first)

- [ ] Camada `StorageService` (interface) com implementação `localStorage`/IndexedDB — fácil de trocar.
- [ ] Versionamento e **migração** do schema de dados salvos; validação com Zod **ao ler** (nunca confiar no que está no storage).
- [ ] **Exportar/Importar** progresso (JSON) — importação validada e com limite de tamanho.
- [ ] Botão "Apagar meus dados locais" (direito de exclusão na prática).
- [ ] Se contas forem necessárias no futuro → ADR próprio + Fase 6B (ver §5).

---

### Fase 7 — Segurança (checklist completo em §3)

Executada **em paralelo** desde a Fase 1; esta fase é o endurecimento e a auditoria final antes do lançamento.

- [ ] Revisão de todos os itens de §3.
- [ ] `security-review` do código + revisão manual de dependências.
- [ ] Teste de headers (securityheaders.com / Mozilla Observatory) — meta nota A/A+.
- [ ] `SECURITY.md` + `/.well-known/security.txt`.

### Fase 8 — Privacidade e conformidade (checklist completo em §4)

- [ ] Política de Privacidade, Termos de Uso, Aviso Legal/Disclaimer, política de cookies (se aplicável).
- [ ] Decisão de analytics (privacy-friendly) e banner de consentimento **somente se necessário**.
- [ ] Canal de contato do titular/encarregado (LGPD).

### Fase 9 — Testes finais e lançamento

- [ ] Suíte E2E dos fluxos críticos; regressão visual (opcional).
- [ ] Auditoria a11y (axe + teste manual com leitor de tela).
- [ ] Teste em dispositivos reais / navegadores-alvo.
- [ ] Domínio, HTTPS/HSTS, variáveis de ambiente de produção, monitoramento (erros + uptime).
- [ ] Soft launch na comunidade (Discord/Reddit) → coletar feedback.

### Fase 10 — Operação contínua

- [ ] **Runbook de atualização de patch:** novo datamining → `data/raw` → `pnpm data:build` → revisão do diff → deploy.
- [ ] Dependabot/Renovate semanal; revisão mensal de segurança.
- [ ] Processo para **takedown** (se o estúdio/titular pedir remoção, conseguimos agir rápido).
- [ ] Métricas de uso (agregadas) para guiar o roadmap.

---

## 3. Segurança — checklist detalhado

**Aplicação (Next.js)**

- [ ] **Headers** via `next.config`/middleware: `Content-Security-Policy` (nonce, sem `unsafe-inline` em scripts), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (desabilitar câmera/mic/geo), `frame-ancestors 'none'` (anti-clickjacking), COOP/CORP.
- [ ] Desabilitar `X-Powered-By` (`poweredByHeader: false`).
- [ ] Sem `dangerouslySetInnerHTML`; se textos do jogo tiverem rich-text/markup, passar por parser seguro + sanitização (DOMPurify) no **pipeline**, não no render.
- [ ] Toda entrada externa validada com Zod (query params, formulários, JSON importado, storage local).
- [ ] Se existirem Route Handlers/Server Actions: validação, **rate limiting**, CSRF (Server Actions já têm checagem de origin — não desativar), limites de tamanho de body, erros genéricos (sem stack trace ao cliente).
- [ ] Redirects/links externos: `rel="noopener noreferrer"`; validar `returnTo`/open redirects.
- [ ] Manter Next.js/React em versões com patches de segurança (acompanhar advisories; já houve CVEs relevantes em middleware e RSC).

**Dados**

- [ ] `data/raw` fora de `public/` e **não servido**; só `processed` vai ao bundle.
- [ ] Pipeline remove metadados do datamining (paths do PC, usernames, hashes de build, chaves/tokens que existam no dump).
- [ ] Verificar se há **segredos ou dados de terceiros** nos JSONs (nunca publicar).
- [ ] Integridade: schema + testes impedem dado malformado de ir pra produção.

**Cadeia de suprimentos / repositório**

- [ ] `pnpm-lock.yaml` versionado, `--frozen-lockfile` no CI; `pnpm audit`/OSV-Scanner no CI.
- [ ] Dependabot/Renovate + revisão humana; dependências mínimas e mantidas.
- [ ] Bloquear scripts de install de terceiros por padrão (`pnpm` `onlyBuiltDependencies`).
- [ ] **Secret scanning**: GitHub secret scanning + push protection; `gitleaks` no pre-commit/CI.
- [ ] CodeQL (SAST) no CI.
- [ ] GitHub Actions: versões **pinadas por SHA**, `permissions` mínimas, sem `pull_request_target` com checkout de fork.
- [ ] 2FA obrigatório nas contas (GitHub, Vercel, domínio, e-mail do registrador).
- [ ] `.env*` no `.gitignore`; segredos só no cofre da plataforma; rotação documentada.

**Infra**

- [ ] HTTPS forçado + HSTS (com preload após validar).
- [ ] DNS com DNSSEC/CAA; e-mail de contato com SPF/DKIM/DMARC.
- [ ] Proteção DDoS/WAF básica (Cloudflare/Vercel) e rate limit por IP em rotas dinâmicas.
- [ ] Logs **sem PII** (sem IP completo, sem conteúdo do usuário); retenção curta.
- [ ] Monitoramento de erros (Sentry com `sendDefaultPii: false` e scrubbing) e uptime.
- [ ] Backups/rollback: deploys imutáveis com rollback de 1 clique.

**Processo**

- [ ] Modelo de ameaças leve (STRIDE) em `docs/security/threat-model.md`.
- [ ] `SECURITY.md` (como reportar vulnerabilidade), `security.txt`, plano de resposta a incidentes (incluindo prazo de comunicação à ANPD se houver vazamento de dados pessoais).

---

## 4. Privacidade e conformidade

> ⚠️ Não sou advogado. Os rascunhos que produzirmos devem ser **revisados por um profissional** antes do lançamento, principalmente a parte de propriedade intelectual.

**4.1 Dados pessoais (LGPD; GDPR se houver público na UE)**

- [ ] **Mapa de dados** (`docs/legal/data-inventory.md`): o que coletamos, por quê, base legal, retenção, com quem compartilhamos.
- [ ] Meta do MVP: **não coletar dados pessoais**. Progresso fica no navegador do usuário.
- [ ] Analytics: preferir ferramenta **sem cookies e sem identificadores** (Plausible, Umami self-hosted, Vercel Web Analytics em modo cookieless). Isso evita banner de consentimento. Se usar Google Analytics → consentimento prévio, IP anonimizado, política de cookies.
- [ ] Sem fontes/CDNs de terceiros que vazem IP (usar `next/font` self-hosted; evitar Google Fonts via CDN).
- [ ] Sem embeds de terceiros (YouTube etc.) sem _click-to-load_.
- [ ] Se vier formulário de contato/feedback: coletar o mínimo, base legal clara, retenção definida, proteção anti-spam sem rastreio (honeypot/Turnstile).
- [ ] **Direitos do titular** (LGPD art. 18): canal de e-mail, prazo de resposta, procedimento de exclusão.
- [ ] Indicar **Encarregado (DPO)**/contato.
- [ ] Menores: o jogo é amplo; declarar que o site não é direcionado a crianças e não coleta dados delas (LGPD art. 14 exige cuidado reforçado).
- [ ] Transferência internacional: documentar onde ficam hospedagem/analytics.

**4.2 Documentos a produzir**

- [ ] **Política de Privacidade** (pt-BR + en): controlador, dados, finalidades, bases legais, compartilhamento, retenção, direitos, contato, cookies/storage local, alterações.
- [ ] **Termos de Uso**: uso permitido, isenção de garantias (dados podem estar desatualizados), limitação de responsabilidade, propriedade intelectual, contato para takedown.
- [ ] **Aviso Legal / Disclaimer** (no footer de todas as páginas): _"Projeto de fãs, não oficial. Não afiliado, endossado ou patrocinado pelo estúdio/publisher. Lightyear Frontier e seus ativos são marcas/propriedade de seus respectivos donos."_
- [ ] **Política de cookies/storage** (mesmo que seja só "usamos localStorage para salvar seu progresso, só no seu dispositivo").
- [ ] Página "Sobre os dados": origem, versão do jogo, que são extraídos pela comunidade e podem conter erros.

**4.3 Propriedade intelectual e datamining (o ponto de maior risco do projeto)**

- [ ] Ler o **EULA/ToS** do jogo: muitos proíbem engenharia reversa/extração de dados. Isso afeta **nossa** conduta, não só a publicação.
- [ ] Verificar se existe **política de conteúdo de fãs** ou uma licença permissiva do estúdio. Na ausência, considerar **pedir autorização por escrito** ao estúdio (e-mail/Discord oficial) — é o caminho mais seguro e muitas vezes bem recebido.
- [ ] Separar claramente: **fatos/estatísticas** (menor risco) × **textos/descrições** (direito autoral) × **assets visuais/áudio/modelos** (maior risco). Recomendação: não redistribuir assets sem permissão; usar ilustrações próprias ou ícones genéricos.
- [ ] Não usar o logo/arte oficial como identidade do site; nome do projeto que não confunda com produto oficial.
- [ ] Monetização (ads/donations) aumenta o risco legal → decisão consciente e documentada; sem vender dados nem dados do jogo.
- [ ] Preparar processo de **takedown** (e-mail visível, resposta rápida).
- [ ] Separar licenças: código (a do repo) × dados do jogo (**não** licenciados por nós; pertencem ao titular).
- [ ] Decidir se `data/raw` vai para o repositório **público**. Se o risco for relevante, mantê-lo privado/fora do git e publicar apenas `processed`.

---

## 5. Itens condicionais (só se virarmos "app com contas")

Se no futuro houver login, sincronização, builds compartilhados, etc.:

- Auth via provedor consolidado (Auth.js/Clerk/Supabase) — **nunca** implementar criptografia/senha manual.
- Senhas: Argon2id/bcrypt via provedor; preferir OAuth/passkeys.
- Banco com **RLS**/autorização por recurso (evitar IDOR), queries parametrizadas (ORM), backups criptografados.
- Cookies de sessão `HttpOnly; Secure; SameSite=Lax`, expiração/rotação.
- Rate limit + bloqueio de brute force; verificação de e-mail.
- Atualizar política de privacidade, mapa de dados, DPA com provedores, fluxo de exclusão de conta e exportação (portabilidade).
- Moderação/UGC: sanitização, denúncia, limites.

---

## 6. Ordem sugerida e marcos

| Marco                      | Fases           | Resultado                                |
| -------------------------- | --------------- | ---------------------------------------- |
| **M0 — Clareza**           | 0               | Escopo e riscos legais definidos         |
| **M1 — Base**              | 1, 2            | Repo com CI e pipeline de dados validado |
| **M2 — MVP navegável**     | 3, 4 (1–2)      | Catálogo + busca no ar (staging)         |
| **M3 — Funcional**         | 4 (resto), 5, 6 | Calculadoras, SEO, progresso local       |
| **M4 — Pronto p/ público** | 7, 8, 9         | Segurança e legal fechados, lançamento   |
| **M5 — Operação**          | 10              | Rotina de patches e manutenção           |

Segurança (§3) e privacidade (§4) **não são fases finais isoladas**: os itens de CI, headers, validação e disclaimer entram já nas Fases 1–3. As Fases 7–8 são a auditoria de fechamento.

---

## 7. Decisões tomadas e perguntas em aberto

**Decididas (Fase 0)**

- ✅ Dados brutos em `d:\projects\frontier-companion-data-raw` (**fora** do repo). O pipeline lê o caminho via `RAW_DATA_DIR`; `data/raw` não existe no git. Inventário em [docs/data-inventory.md](docs/data-inventory.md).
- ✅ Imagens: 1103 ícones PNG de UI (~17,7 MB) disponíveis → o pipeline converte para WebP/AVIF e gera mapa `itemId → ícone` com fallback.
- ✅ Repositório **privado** agora; público depois — **gate obrigatório antes de abrir** (ver abaixo).
- ✅ Monetização: apenas **Buy Me a Coffee** (link/botão simples; sem ads, sem vender dados, sem paywall de conteúdo do jogo).
- ✅ Idiomas: pt-BR + en (os dados já trazem ambos).
- ✅ Sem contas de usuário no MVP.

**Gate antes de tornar o repo público ou lançar o site**

1. Ler o EULA/ToS do jogo e procurar política de fan content do estúdio; idealmente obter **autorização por escrito** — especialmente para os **ícones** (arte oficial) e porque o Buy Me a Coffee torna o projeto "com fluxo de dinheiro" (aumenta o risco, mesmo sendo doação).
2. Sem autorização: publicar só dados factuais (números, nomes, relações) e **trocar os ícones** por arte própria/genérica; manter `data/raw` e PNGs fora do histórico git público.
3. **Cuidado com o histórico git:** se os ícones/JSONs entrarem em qualquer commit e depois o repo virar público, o histórico expõe tudo. Por isso: assets processados só entram no repo quando decidirmos; até lá `.gitignore` + (se for versionar) repositório separado/privado para assets.

**Ainda em aberto**

1. Mostrar conteúdo com _feature flag_ desligada (provavelmente não lançado)? Sugestão: ocultar por padrão.
2. ✅ Spoilers (missões/lore): **toggle "mostrar spoilers"**.
3. ✅ Nome: **Frontier Companion** (sem domínio por enquanto; evitar logo/arte que sugira afiliação oficial).
4. ✅ Contato: soareswdesign@gmail.com.
5. ✅ `gameVersion`: **1.0.2571**.

---

## Próximo passo

Fase 0 está **quase fechada** (falta o gate legal e as perguntas acima — nenhuma bloqueia a Fase 1). Seguimos com a **Fase 1: scaffold** (Next.js + Tailwind 4 + CI + qualidade), e depois a Fase 2 (pipeline de dados) usando o inventário.
