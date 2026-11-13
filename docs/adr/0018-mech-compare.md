# ADR 0018 — Comparador de níveis do Mecha

- Status: aceito

## Decisão

`/mech/compare/[category]` mostra, para uma categoria de parte do mecha (motor, serra, pernas…), **todos os níveis lado a lado** numa tabela: uma coluna por nível (com ícone e link), uma linha por atributo e, abaixo, uma linha por item de custo. Atributo ou custo que um nível não tem aparece como "—".

- É uma página estática (sem estado no cliente, sem JS extra); a categoria vem da rota, não de query param, e só categorias de parte existem (chips e nomes desconhecidos respondem 404).
- Linhas: atributos e itens de custo na ordem em que aparecem pela primeira vez entre os níveis (função pura `comparisonRows`, testada); valores formatados como no resto do Mecha (`formatStatValue`).
- Cada categoria de parte tem o link "Comparar níveis" na sua lista.
- Sem destaque de "melhor valor": o dado não diz qual é melhor para cada jogador.

## Limites

- Compara níveis da mesma categoria. Escolher níveis livremente ou comparar categorias/itens diferentes (o comparador do PLANO, item 5) fica para depois, se houver uso.
- Não soma custos (ex.: custo total do Mk. 1 ao Mk. 5).
