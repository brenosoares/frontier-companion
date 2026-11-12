# ADR 0008 — Receitas e calculadora de materiais (Fase 4)

- **Status:** aceito

## Dados observados (1.0.2571)

- 362 receitas, 146 itens fabricáveis, **sem ciclos**, profundidade máxima 5.
- Em 131 itens, as "variantes" só diferem no **tamanho do lote e na estação** (1×, 5×, 25×…), com a mesma proporção de ingredientes por unidade.
- Em 15 itens (sementes e pós) há variantes de **ingredientes diferentes**: p. ex. `WheatSeeds` = 20 fibras → 1, 1 trigo → 2, 1 trigo mutante (`_Rare`) → 3.
- 32 itens fabricáveis dependem, no plano padrão, de algum material **sem origem conhecida** (p. ex. corantes → colorflores).

## Decisões

1. **Variante = conjunto de ingredientes por unidade** (razão reduzida). Receitas que só mudam lote/estação formam **uma** variante, representada pelo **menor lote** (evita desperdício e a estação mais básica). A chave da variante é o id dessa receita (estável, vai na URL).
2. **Receita padrão por item:** evita ingredientes que não são fabricáveis nem têm origem conhecida (ex.: planta mutante), depois menor nível de livro, depois menos ingredientes por unidade. O jogador pode trocar a variante.
3. **Planejamento (`planCrafting`, função pura):** ordenação topológica; a demanda de **todos os pais** é somada _antes_ de arredondar os lotes de cada item (arredondar por pai desperdiçaria insumos). Resultado: materiais a obter, etapas em ordem de fabricação (dependências primeiro) e sobras. Detecta ciclo (erro explícito) e valida a quantidade (1–99.999).
4. **Tempo:** mostra o tempo **por lote** de cada etapa; **não** soma um total (máquinas rodam em paralelo; um total seria enganoso).
5. **Materiais sem origem conhecida** recebem o selo "Origem desconhecida" em vez de esconder o problema.
6. **Cálculo no cliente** (146 itens, ~360 receitas): instantâneo e a página continua estática. O estado (`item`, `qty`, `v=<item>:<variante>`) vive na URL, é validado (ids por regex, quantidade só dígitos e limitada) e espelhado com `history.replaceState`. O campo de quantidade aceita só dígitos e restaura um valor válido ao perder o foco.
7. **(Substituída pelo ADR 0009)** O catálogo de receitas em lista única foi trocado por categorias → cards → detalhe. Antes disso: **catálogo paginado** ("Mostrar mais", 40 por vez) com filtro por estação e busca sem acento nos nomes de saída, ingredientes e estações, em todos os idiomas.
8. **Features continuam isoladas:** o calculador mora em `recipes`; os dados de itens (nome, ícone, "tem origem?") chegam por props montadas na página. O `ItemIcon` foi para `shared/ui` e `normalizeText` para `shared/lib/text` porque agora duas features os usam.
9. **Armadilha corrigida:** uma mensagem em forma de **função** (`recipes.bookLevel`) chegava a um componente cliente e quebrava o build (funções não cruzam servidor→cliente). Agora é um texto com `{level}`, e o tipo dos rótulos do cliente é mapeado para `string`, então reintroduzir uma função **falha no typecheck**, não só no build.

## Fora de escopo (por ora)

- Calculadoras de rendimento/tempo/custo (plano, item 4 da Fase 4) além de materiais.
- Aproveitar sobras entre etapas e otimizar lotes maiores (só o menor lote é usado).
