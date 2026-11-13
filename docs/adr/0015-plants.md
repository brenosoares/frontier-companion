# ADR 0015 — Plantas

- Status: aceito

## Contexto

`DT_SmallPlants` (13 lavouras) e `DT_LargePlants` (36 plantas grandes) descrevem o cultivo. Dos grandes, 23 são cenário (`IsNode` verdadeiro: árvores e arbustos que já existem no mundo). `DT_PlantToSeed` liga cada planta à sua semente.

## Decisão

Seção **Plantas** (menu, `/plants`, `/plants/[id]`):

- **O que entra:** todas as lavouras e as plantas grandes que **não** são cenário (Árvore-luz, as oito coloriflores, Gravelgourd, Pondpitcher e as duas árvores mutadas). Cenário fica de fora; as origens de item vindas dele continuam listadas na página do item, sem link.
- **Dados:** nome, ícone, tipo de nutriente (só lavouras), dias para amadurecer, dias até secar, semente, o que a colheita dá (quantidade mínima e máxima e chance de cair ao menos uma unidade), frutos (tempo para crescer e quantidade na vida, só plantas grandes) e nível de quebra necessário (só plantas grandes).
- **Chances:** mesmo cálculo das origens de item (`summarizeDrops`, agora compartilhado): a soma dos pesos das quantidades positivas sobre o total.
- **Sem dado, `null`:** planta sem semente nos dados (Refilita) mostra que o jogo não indica uma; planta sem fruto não tem seção de frutos.
- Na página do item, a origem "colhida de planta" e "fruto da planta" linka para a planta quando ela tem página.
- Ícones pixel em `public/icons/plants/` (só os usados). Conteúdo "WIP/placeholder/obsoleto" é descartado com aviso.

## Limites

- "Dias até secar" é a leitura do campo `DaysToDry`; o dado não explica a regra de rega.
- Não mostramos solo preferido/nocivo, `LiquidReqCl` nem `HarvestResistance`: o dado não deixa claro o efeito para o jogador (YAGNI).
- Fertilizantes (`DT_FertilizerReagents`) e a qualidade da colheita (`DT_QualityRates`) ficam para uma etapa própria.
