# ADR 0005 — Design system, layout e i18n (Fase 3)

- **Status:** aceito

## Decisões

1. **Tokens em duas camadas** (`src/app/globals.css`): (a) paleta de marca fornecida pelo dono (`--color-frontier-*`), crua; (b) **tokens semânticos** por tema (`background`, `surface`, `foreground`, `muted`, `border`, `primary`, `link`, `tone-*`…). Componentes usam **só os semânticos**. Marca crua não é usada para texto.
2. **Contraste AA verificado numericamente.** A paleta de marca falha AA em usos comuns (vermelho/roxo como texto sobre o fundo escuro: 3,6 e 3,1; texto branco sobre verde/laranja/azul: 3,3–4,1). Soluções: botão primário = verde + **texto escuro** (5,4:1); variantes `-soft` (Tailwind 400) para texto colorido no escuro; tons mais profundos no tema claro. axe roda no CI em 4 páginas × 2 idiomas × 2 temas.
3. **Tema:** escuro por padrão; claro via `prefers-color-scheme`. **Sem toggle manual por ora** (exigiria storage + tratamento de flash; Fase 6 se houver demanda).
4. **Radix UI só onde a acessibilidade é difícil** (Dialog → `Sheet` do menu mobile: foco, Escape, scroll lock) + `Slot`. Estilo próprio em Tailwind, variantes com `cva`. Sem shadcn/biblioteca de componentes pronta.
5. **i18n próprio, sem biblioteca**, seguindo o guia oficial do Next 16: rota `app/[locale]`, `generateStaticParams`, dicionários TS. O shape é derivado de `pt-BR.ts` (tipo `Messages`); `en.ts` precisa casar em tempo de compilação, e um teste barra strings vazias. Mensagens com valores são funções tipadas (`dataVersion(v)`).
6. **`/` redireciona para `/pt-BR`** (config). Detecção por `Accept-Language` via `proxy` fica **adiada**: tornaria a rota dinâmica e a simplicidade static-first vale mais agora.
7. **Layout:** sidebar à esquerda (≥ `lg`), à direita header (logo + busca + idioma), conteúdo e footer. Abaixo de `lg` a sidebar vira menu off-canvas. Skip link, landmarks e `aria-current`. A navegação é declarada em um único lugar (`app/[locale]/navigation.tsx`); `Sidebar`/`Header` são apresentacionais (recebem os itens por props).
8. **Busca no header é só UI e está desabilitada** ("Busca em breve") até a Fase 4, para não enganar o usuário com um campo que não faz nada.
9. **Páginas legais são placeholders** ("em elaboração") só para o footer não apontar para 404; o texto real e revisado é a Fase 8.
10. **Manifest do dataset** (`DatasetManifestSchema`) é importado estaticamente (sem I/O em runtime, compatível com `cacheComponents`) e validado no build; o pipeline usa o mesmo schema.
11. **Buy Me a Coffee** só aparece se `NEXT_PUBLIC_BMC_URL` estiver definida (link externo com `noopener noreferrer` e aviso de nova aba para leitores de tela).

## Consequências

- Todo texto novo de UI exige entrada em `pt-BR.ts` **e** `en.ts` (o compilador cobra).
- Para a Fase 4, ler `data/processed` em Server Components exigirá import estático (como o manifest) ou `"use cache"`, por causa de `cacheComponents`.
