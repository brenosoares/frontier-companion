# ADR 0009 — Página de Receitas em categorias, construções e flags lançadas (Fase 4)

- **Status:** aceito (flags, "[Obsolete]" e "PLACEHOLDER" decididos pelo dono; classificação das construções revisada)

## Contexto

A primeira versão da página de Receitas era uma lista única de 362 receitas com filtro. O dono pediu:
**categorias primeiro → itens da categoria em cards (ícone, nome, custo, onde é feito) → clique abre o detalhe**,
com as categorias do jogo ("decorativo, modular, storage…").

## Decisões

1. **Dois escopos, uma página:** _Construções e decorações_ (do menu de construção) e _Fabricação_ (itens feitos em máquinas).
2. **Entidade `Construct`** (`constructs.json`, 550): nome/descrição localizados, ícone, **custo em recursos** (`ItemCost`), conforto, flag e **preço do blueprint** no mercador (`DT_MerchantBundleEntries`, 270 construções são vendidas).
3. **Categorias oficiais do jogo.** Os nomes existem na localização (2 abas: _Constructs_, _Decorations_; 14 subcategorias, incluindo **Modular**, que só existe em inglês no jogo). **Não existem** "Energia"/"Utilidade". Os dados **não** ligam cada construção a uma subcategoria: só trazem a aba (`MainConstructCategory::NewEnumeratorN`) e um código de tipo sem nome (`ConstructType::NewEnumeratorN`), e o mesmo código aparece em abas diferentes.
4. **Classificação nossa, explícita e revisável** (`extractors/construct-category.ts`), inferida do conteúdo de cada grupo (aba, tipo):

   | Aba:tipo                           | Categoria                                                          | Conteúdo observado                                             |
   | ---------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
   | 0:0                                | Criação                                                            | máquinas, tubulações, estações de pesquisa                     |
   | 0:1                                | Itens Básicos                                                      | centro da fazenda, canhão de entrega, camas, tendas, geradores |
   | 0:5                                | Fazenda                                                            | parcelas                                                       |
   | 0:8 e 0:10                         | Armazenamento                                                      | caixas, barris, galpões, silos, caixotes e frascos             |
   | 0:13                               | Modular                                                            | fundações, pisos, paredes, telhados, vigas, portas, janelas    |
   | 1:2                                | Cercas (família `Arch` → Arcos)                                    | cercas e arcos                                                 |
   | 1:4 / 1:5 / 1:6 / 1:7 / 1:9 / 1:12 | Luzes / Plantas / Placas / Ornamentos / Móveis / Montado na Parede |                                                                |
   | 1:10                               | Fazenda (decoração)                                                | espantalho, feno, carroça, bomba d'água, caixotes de troféu    |
   | 1:13                               | Modular (decoração)                                                | persianas                                                      |

   Um grupo desconhecido **falha o build** com o nome da construção, então um patch novo não deixa nada sem categoria. _Propriedades_ (casas) ficou vazia: só tinha conteúdo "WIP".

5. **Fabricação por família de máquina** (`Station.family`): os níveis (Fornalha, II, III; Triturador 1–3…) formam uma família; o forno desidratador solar entra em "Forno Desidratador". Cada item aparece uma vez por família, com todos os níveis que o fazem (em ordem pelo nome), custo da receita padrão e rendimento do menor lote.
6. **Flags lançadas = decisão do dono.** O dump não diz quais flags estão ativas e **387 de 565 construções** tinham flag (as 174 peças modulares, todas). `RELEASED_FEATURE_FLAGS` (`scripts/data-pipeline/config.ts`) lista as flags que o dono confirma como lançadas; conteúdo sob elas não fica oculto (vale para itens e construções). **O dono confirmou que TODAS as 15 flags da 1.0.2571 já foram lançadas** (Automator, AutumnSprouts2024, CarMode, Christmas2024, FarmerCustomization, LargeItemsAndMechHauling, Legacy, Limbo, MegaPatch1Miscs, Mesa, MiniPatch1Mics, ModularBuilding, Neighbours, RanchAnimals, Trailers). Elas estão listadas **explicitamente** (e não como "tudo"): uma flag nova de um patch futuro volta a ocultar seu conteúdo e o `pnpm data:build` **avisa** qual flag e quantas entradas, até o dono confirmar. O toggle "possivelmente indisponível" só aparece quando há algo oculto.
7. **Conteúdo de desenvolvimento ou aposentado é descartado:** "WIP", **"PLACEHOLDER"** (3 construções) e **"[Obsolete]"** (Automator e Automator II; o dono verificou no jogo que não existem mais, e o próprio dump já os esconde da lista de uso). Palavra inteira apenas. **PLACEHOLDER é descartado por decisão do dono** (contexto abaixo).
8. **Blocos reutilizáveis em `shared/ui`:** `CraftCard` (card) e `CardExplorer` (grade com filtro, toggle de indisponíveis e paginação, estado na URL) servem às duas seções; `GameIcon` substitui `ItemIcon` e serve `/icons/items` e `/icons/constructs` (488 ícones de construção publicados).
9. **Camadas:** `app/[locale]/recipes/recipe-catalog.ts` é o único ponto que junta construções, itens, receitas e estações e entrega dados simples (cards) à interface. Features continuam isoladas.
10. **Rotas** (construções passaram para `/constructs`, ver [ADR 0013](0013-constructs-section.md)): `/recipes` (hub), `/recipes/[categoria]` (ids `constructs-storage`, `decorations-lights`, `craft-Furnace`…) e `/recipes/constructs/[id]` (detalhe). O detalhe de item fabricado continua em `/items/[id]`.
11. **"Onde é feito"** de uma construção é "Modo de construção" (todas são feitas nele) e, no detalhe, o preço do blueprint no mercador quando o jogo o vende.

## Ícones: associação tolerante

O jogo escreve o nome do ícone com uma caixa de letras diferente da do arquivo (`T_Seedmaker2Icon` x `SeedMaker2Icon.png`; `GloFruit` x `GlofruitIcon`) e há um arquivo com `t_` minúsculo (`t_DroneStation2Icon.png`, que o `icons.py` não limpou). `resolveIcon` ignora maiúsculas/minúsculas e o prefixo `T_`/`t_`, e devolve o **nome real do arquivo**. Mesmo assim, 1 item e 67 construções continuam **sem arquivo no conjunto** (peças modulares de madeira, algumas mobílias, casas de NPC…): o `pnpm data:build` lista todos, por id, a cada execução.

## Consequências

- Com todas as flags lançadas, nada fica oculto hoje (a UI de "possivelmente indisponível" segue pronta para flags futuras, coberta por testes unitários).
- A classificação (item 4) é inferência: revisar antes do lançamento.

## Contexto do "PLACEHOLDER" (decidido: descartar)

Três construções têm "PLACEHOLDER" no nome e na descrição, hoje descartadas:

| Id                   | Nome no dump                                                  | Flag       | O que é                                        | Sinais de inacabado                                                                 |
| -------------------- | ------------------------------------------------------------- | ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `WaterTower`         | PLACEHOLDER - Water Tower (pt-BR: "PLACEHOLDER Caixa d'Água") | Limbo      | caixa d'água (aba Construções > Armazenamento) | sem custo, sem blueprint no mercador, descrição em inglês mesmo em pt-BR; tem ícone |
| `UlfExperimentScene` | PLACEHOLDER - Super Experiment Station                        | Neighbours | cenário do NPC Ulf ("Care! Acid inside.")      | sem custo, sem ícone, escondida da lista "usado em"                                 |
| `UlfForestScene`     | PLACEHOLDER - Super Soil Station                              | Neighbours | cenário do NPC Ulf (amostras de solo)          | sem custo, sem ícone, escondida da lista "usado em"                                 |

Nenhuma tem custo em recursos, blueprint ou referência em outra tabela: não são construíveis pelo jogador como estão. Decisão do dono: descartar as três.
