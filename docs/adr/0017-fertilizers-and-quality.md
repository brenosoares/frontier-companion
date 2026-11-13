# ADR 0017 — Fertilizantes, reagentes e qualidade da colheita

- Status: aceito

## Contexto

Três fontes tratam do que ajuda as plantas:

- `DT_FertilizerReagents`: itens (colheitas e pós de cristal) com um efeito (`EPlantEffect`) e uma potência. Traz uma linha de planilha sem sentido (`#N/A`).
- `DT_QualityRates`: para cada nível de qualidade (−3 a 3), o peso de cada resultado de colheita (Poor, Average, Fine, Exquisite).
- Itens com a tag `Fertilizer` (os adubos e "Yield Fertilizer") e `Powder` (os pós), com receitas na composteira.

## Decisão

Página **Fertilizantes e qualidade** (`/plants/fertilizing`, ligada em `/plants`), com:

- **Adubos:** os itens com tag `Fertilizer` e `Powder` já existentes, cada um com as receitas que o produzem (nada novo no pipeline).
- **Reagentes:** os 9 itens de `DT_FertilizerReagents` com efeito e potência. A linha `#N/A` é descartada com aviso (rows cujo id não é item). Na página do item, um bloco "Reagente de fertilizante" mostra o efeito e linka para esta página.
- **Qualidade da colheita:** tabela com a chance de cada qualidade por nível. Pesos que somam 100 (validado); uma qualidade ausente na linha vale 0; qualidade desconhecida falha o build.

Rótulos dos efeitos seguem os nomes do jogo (`ST_PlantEffects`: "Retenção de líquidos", "Máx. de frutas"…); as tintas não têm nome lá e são nossas. Qualidades: Ruim, Média, Boa, Excelente (nossas; o jogo só traz o enum).

## Limites

- O dado não diz **como se chega a cada nível de qualidade** nem **onde** o reagente é aplicado; mostramos só a tabela e o efeito, sem prometer a regra.
- A **potência** não tem unidade nos dados; aparece como número (e some quando é 0, como no Trigo).
- Não afirmamos qual adubo serve a qual nutriente: o nome sugere, o dado não diz.
