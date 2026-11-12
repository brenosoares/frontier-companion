# ADR 0010 — Mais origens de itens (Fase 4)

- **Status:** aceito

## Contexto

Depois do ADR 0007, 49 itens ainda apareciam como "não identificamos de onde vem". Investigamos
as tabelas do jogo. Muitas só mencionam o item como **custo** (entregas, upgrades, pedidos de NPC),
o que não é origem e foi ignorado.

## Novas origens (`ItemSource`)

| Tipo           | Fonte nos dados                                                         | Mostra                            |
| -------------- | ----------------------------------------------------------------------- | --------------------------------- |
| `plant-fruit`  | `FruitDrops` das plantas grandes (colorflores, Fruta-luz)               | planta, quantidade e chance       |
| `merchant`     | `DT_MerchantBundleEntries` com `Type = Item` (40 itens, sem duplicatas) | preço                             |
| `mutation`     | convenção de nome (abaixo)                                              | link para as sementes modificadas |
| `care-package` | `Pool` dos pacotes de ajuda de recursos e de estruturas                 | só "pode vir em pacotes de ajuda" |

## Decisões

1. **O que o dado não diz fica `null`, nunca inventado.** `sourceName`, `minAmount`/`maxAmount` (ambos ou nenhum), `chance` e `price` agora são anuláveis. Mercadores e pacotes de ajuda não têm nome nem quantidade nos dados: a interface mostra o tipo da origem e só os selos que existem.
2. **Plantas mutantes (`X_Rare`, "(Mutante)") são vinculadas por inferência.** O jogo não tem tabela para isso (é código), mas os 12 itens `X_Rare` correspondem 1 a 1 às 12 sementes `XSeeds_Refined`, cujo texto no jogo diz "Cresce e vira um X Mutante". Se uma `_Rare` não tiver sementes correspondentes, **nenhuma origem é criada**. A integridade exige que a semente exista.
3. **Mercador: só itens.** Blueprints e peças de mecha continuam fora (blueprints já alimentam o preço do detalhe da construção). O mercador não tem nome localizado nos dados, então não inventamos um.
4. **Pacote de ajuda sem quantidade nem chance.** Os campos `MinAmount`/`MaxAmount` dependem do marco de progressão e do sorteio entre itens do pool; mostrar "20–30×" seria enganoso.
5. **"Origem conhecida" ≠ "obtenível diretamente".** A calculadora usa a primeira noção para o selo "Origem desconhecida" e a segunda (sem mutação) para escolher a receita padrão. Sem isso, o trigo mutante, que tem origem agora, passaria a ser o ingrediente padrão das sementes (mais barato por unidade) embora exija fabricar sementes modificadas antes. O mesmo critério vale para o custo mostrado nos cards de fabricação.

## Resultado

Itens sem receita e sem origem: **49 → 22**. Ficam sem nenhum dado no jogo: peças de alumínio, vidros coloridos, achados do mundo (concha, estrela-do-mar, fósseis, meteorito), ovos, água, cera, "Noxious Pod", "Natural Coil", "Tall Tech", "Elf Hat" e dois brotos mutantes que só aparecem em trocas com vizinhos.

## Fora de escopo

- **Trocas com vizinhos** (`DT_SproutTrading`, `DT_EggTrading`, `DT_TradeableBundles`): a semântica de moeda e pacotes não está clara nos dados.
- Origem de itens sem nenhum registro (lista acima): só com dados novos do jogo.
