# ADR 0011 — Seção de animais (Fase 4)

- **Status:** aceito

## O que foi pedido

Uma seção separada sobre os animais: o que dão (loot), alimentação e criação.

## Dados (1.0.2571)

- `DT_RanchAnimals` (6 animais criáveis): sede e fome por dia, espaço mínimo, companhia mínima, dias de incubação e de crescimento, dias triste até fugir e fugido até sumir, produto, esterco, ovo e ícone.
- `DT_Critters` (8 criaturas): nome localizado e **dieta** (Nitrogenic, Phosphoric, Potassic). Jellyfinch e Znork **não** têm dados de rancho.
- `DT_CritterFood`: cada linha é uma **forragem** (o id da linha é o id do item) e a dieta que ela alimenta. O jogo confirma que a forragem se fabrica no Forno Desidratador (Trigo → Forragem Suave, Polibaga → Azeda, Repolho → Doce).

## Decisões

1. **Entidade `Animal`** (`animals.json`, 6): une rancho + criatura + forragem da dieta. Dieta desconhecida, dois alimentos para a mesma dieta ou animal sem criatura **falham o build**.
2. **O esterco vem do campo do próprio animal, não da dieta.** Nem sempre coincidem (o Caulegarto come potássio e produz esterco fosfórico; o Múfalo, o inverso). Mostramos cada campo como o jogo traz, sem deduzir.
3. **Não afirmamos periodicidade.** Fome e sede são "por dia" (o dado diz). Para produto/esterco/ovo o dado traz só a quantidade, então não escrevemos "por dia".
4. **Estruturas do rancho são curadas à mão** (`animals/ranch-structures.ts`): incubadora, comedouros, bebedouros, abrigos, camas, estação de visão geral e estúdio de acessórios. O jogo não agrupa essas construções, então escolhemos pelos nomes e famílias. Um teste de contrato falha se um id sumir do dataset num patch.
5. **Integração:** na página de item, a origem "produto/esterco/ovo de animal" agora **linka para o animal**; o detalhe linka forragem, produto e ovo para as páginas de item (a forragem mostra como fabricar). Ícones dos animais em `public/icons/animals/` (6 arquivos). Rótulos de dieta alinhados ao vocabulário do jogo ("Dejetos Nitrogênicos").
6. **Rotas:** `/animals` (lista + estruturas) e `/animals/[id]`.

## Fora de escopo (por ora)

- **Loot de criaturas selvagens por região** (`DT_CritterRegionDrops`): os nomes de região no dado (`Region.OutsetGrasslands.Mountain`) não casam com segurança com os textos de região do jogo.
- **Lentes da incubadora** (efeitos de chance de animais maiores, menores, raros ou gêmeos): os percentuais não estão ligados aos itens nos dados.
- **Acessórios** (12 chapéus do Estúdio de Acessórios) e **interações entre animais**.
- **Trocas de ovos com vizinhos** (mesma ambiguidade do ADR 0010).
