# ADR 0016 — Criaturas e animais são a mesma lista

- Status: aceito
- Ajusta o modelo do [ADR 0011](0011-animals.md) (animais) e do [ADR 0012](0012-blueprint-extraction.md) (alimentar bicho selvagem).

## Contexto

`DT_Critters` tem 8 criaturas; `DT_RanchAnimals` tem 6, **todas também presentes** em `DT_Critters` (nenhuma só do rancho). As outras duas, Mantilha Matutina (Jellyfinch) e Peixe-mergulhador (Znork), existem só na natureza. Ou seja, "criaturas selvagens" e "animais do rancho" não são listas diferentes: é uma lista e alguns itens dela podem ser criados.

## Decisão

Uma única entidade e uma única lista em `/animals`, com as 8 criaturas:

- Todas têm nome, dieta, forragem e o que alimentá-las na natureza dá (recurso sempre; ovo, com chance, quando o Blueprint traz um).
- Só as 6 do rancho têm `ranch`: produto, esterco, necessidades e ciclo de vida. As outras ficam com `ranch: null`, marcadas "Só selvagem", e a página omite "O que dá" e "Criação" e diz que o jogo não traz como criá-las.
- O ovo e a chance ficam em `wildFeeding.egg` (antes, o ovo estava em `loot` e a chance em `wildFeeding`). Para as do rancho, o pipeline continua falhando se o ovo do rancho, o ovo selvagem e a tabela da incubadora divergirem.
- Alimentar uma criatura só selvagem vira origem de item (`critter-feed`): Mantilha dá Pena; Peixe-mergulhador dá Cristal Vermelho.
- Sem ovo, as lentes e a incubadora não aparecem na página.
- O ícone vem da linha do rancho; as duas só selvagens não têm ícone pixel nem dado de ícone, então mostram o glifo genérico.

## Limites

- `DT_CritterRegionDrops` (3 regiões com itens e pesos) não diz a qual criatura pertence nem em que situação cai; nenhum Blueprint exportado o referencia. Fica de fora até haver ligação nos dados (sem inventar).
- Não há descrições nem região de aparição das criaturas nos dados (`Description` e `CodexDescription` vêm vazios).
