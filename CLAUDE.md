# Regras para IAs (Claude e outros agentes)

@AGENTS.md

Estas regras valem para qualquer agente de IA neste repositório. Em caso de conflito com um pedido, **pare e pergunte** — não improvise nem "corrija" decisões já tomadas.

## 1. Fontes de verdade (leia antes de agir)

1. [PLANO.md](PLANO.md) — fases, princípios, segurança, privacidade e decisões (§7).
2. [docs/adr/](docs/adr/) — decisões de arquitetura. Para mudar uma, crie um novo ADR (não edite o histórico).
3. [docs/data-inventory.md](docs/data-inventory.md) — o que existe nos dados do jogo e riscos conhecidos.
4. [CONTRIBUTING.md](CONTRIBUTING.md) — fluxo e convenções.

Trabalhe **somente na fase atual** do plano. Não antecipe fases nem adicione escopo (YAGNI). Ao concluir uma fase/tarefa, atualize os checkboxes do PLANO.md.

## 2. Decisões travadas (não alterar sem pedido explícito do dono)

- Stack: Next.js 16 (App Router) + React 19 + TypeScript estrito + Tailwind CSS 4 + pnpm. Sem trocar de framework, gerenciador de pacotes ou biblioteca de estilo.
- **Static-first**: sem banco, sem API pública, sem contas de usuário no MVP. Dados vêm do pipeline validado em build (ADR 0002).
- Idiomas: pt-BR e en. Nome: **Frontier Companion** (projeto de fãs, não oficial). Versão do jogo: `1.0.2571`.
- Conteúdo com _feature flag_ desligada fica **oculto por padrão**; spoilers (missões/lore) atrás de toggle.
- **Conteúdo "Wip" (work in progress) do jogo é sempre descartado** pelo pipeline (itens, receitas, origens), com aviso; um teste de contrato garante que nada "Wip" chegue ao dataset.
- Monetização: **apenas Buy Me a Coffee**. Proibido adicionar ads, analytics com cookies/identificadores, trackers, pixels ou qualquer SDK de terceiros sem aprovação.
- Contato oficial: soareswdesign@gmail.com.

## 3. Arquitetura e código

- Camadas: `app → features → shared` (imposto pelo ESLint; nunca desabilite a regra). `shared` não importa de `features`/`app`; uma feature não importa de outra.
- Cada feature: `domain/` (regras puras, sem React/I-O) → `data/` (repositórios atrás de interface) → `components/`.
- **Schemas Zod são a única fonte dos tipos** (`z.infer`). Toda entrada externa é validada: JSON do jogo, query params, storage local, arquivos importados.
- SOLID, DRY, KISS, YAGNI. Funções pequenas, nomes claros, sem `any`, sem `@ts-ignore`/`eslint-disable` sem justificativa em comentário, sem código morto, sem comentários que narram o óbvio.
- Server Components por padrão; `"use client"` só onde há interação.
- Next 16 difere do que você conhece (ex.: `proxy` no lugar de `middleware`, `cacheComponents`). **Leia `node_modules/next/dist/docs/` antes de usar uma API do Next.**
- Não adicione dependências sem necessidade clara; justifique no PR (manutenção, tamanho, segurança). Nada de `postinstall` de terceiros.
- Nada de `dangerouslySetInnerHTML`; rich text do jogo é sanitizado **no pipeline**.
- Dados do jogo só são lidos por repositórios; o único lugar que conhece os JSONs é `src/app/[locale]/data.ts` (composition root). Features **não se importam**: a página (`app`) compõe e passa _view models_. Props de componentes cliente são só dados simples (sem funções).
- `next.config.ts`: `partialPrefetching` fica `false` (senão rotas inexistentes respondem 200 em vez de 404; ADR 0006).
- Textos de UI em `src/shared/i18n/messages` (`pt-BR.ts` é a fonte do shape; `en.ts` deve casar). Nunca hardcode texto nos componentes. Rotas ficam sob `app/[locale]`.
- Estilo: use **somente tokens semânticos** (`bg-surface`, `text-muted`, `text-primary-foreground`, `tone-*`…) definidos em `globals.css`; não use as cores cruas `frontier-*` para texto. Toda cor nova precisa passar AA nos dois temas (ADR 0005).
- Componentes de UI novos: Tailwind + `cva` (+ Radix só quando a acessibilidade for difícil, ex.: dialog/menu). Sem bibliotecas de componentes prontas.
- Acessibilidade é requisito: teclado, contraste AA, labels, `prefers-reduced-motion`.

## 4. Limites legais e de privacidade (INEGOCIÁVEIS)

- **Nunca** commitar: dumps brutos do jogo (`FarMech/`, `data/raw`), PNGs/ícones originais do jogo, áudio, textos de EULA (`DT_Agreements`), falas (`ST_VOText`, `DT_AdditionalSpeechLineData`), segredos ou `.env*`. Os dados brutos ficam **fora do repo** (`RAW_DATA_DIR`).
- **Nosso JSON curado (`data/processed/`) é versionado** e é a única forma de dado do jogo que o app consome. Ele é gerado **somente** por `pnpm data:build` (nunca editar à mão) e contém só o que a UI usa, em schemas nossos (ADR 0004). Não inclua nele lore/falas/EULA, caminhos de asset do engine, nem campos "por garantia".
- **Ícones:** os PNGs originais do jogo nunca entram no repo. A única exceção, decidida pelo dono, é o conjunto em **pixel art** (`icons_pixel`, gerado fora do repo a partir dos originais), publicado pelo pipeline em `public/icons/items/` (só os usados). Não commite nenhum outro asset gráfico do jogo. O **gate legal** (PLANO.md §7) vale para tornar o repo público e lançar: pixel art derivada de arte oficial continua sendo obra derivada; o JSON curado também tem nomes e descrições do jogo.
- Não usar logo/arte oficial como identidade do site; sempre exibir o disclaimer de projeto não oficial.
- Coletar o mínimo de dados pessoais (meta: zero). Sem fontes/CDNs/embeds de terceiros que vazem IP; fontes via `next/font`.
- Logs e erros sem PII. Mensagens de erro ao cliente são genéricas.
- Não escrever textos jurídicos definitivos como se fossem aconselhamento: são rascunhos para revisão humana.

## 5. Git e fluxo

- `main` = produção; `develop` = desenvolvimento. Trabalhe em branches a partir de `develop` (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`) e entregue via **PR para `develop`**.
- **Nunca** commitar/pushar direto em `main` ou `develop`; nunca `--force`, `--no-verify` ou pular hooks/CI. Se um hook falhar, corrija a causa.
- Só faça commit, push ou abra PR **quando o dono pedir**. Merge para `main` só por pedido explícito.
- Commits em **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), pequenos e focados.
- Use o template de PR e preencha o checklist com honestidade.

## 6. Definition of Done (antes de dizer "pronto")

Rode e reporte o resultado real:

```
pnpm check        # lint + typecheck + format:check + testes
pnpm test:e2e     # quando mexer em UI/rotas/headers
pnpm build
```

- Comportamento novo tem teste (domínio puro: 100% dos casos relevantes). Bugfix começa com teste que falha.
- Se algo falhou, foi pulado ou não foi verificado, **diga claramente**; não declare sucesso sem evidência.
- Sem vulnerabilidade alta no `pnpm audit`.

## 7. Como trabalhar com o dono

- Responda em **português (pt-BR)**; código, nomes de símbolos e commits em inglês.
- Antes de ações destrutivas ou externas (apagar, sobrescrever, push, publicar), confirme.
- Ambiguidade de requisito que muda o resultado → pergunte. Detalhe com padrão convencional → escolha, avise e siga.
- Apresente recomendação, não um catálogo de opções.
- Registre decisões novas no PLANO.md (§7) e em ADR quando forem arquiteturais.
