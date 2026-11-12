# ADR 0007 — Origem dos itens, ícones pixel art e botão primário

- **Status:** aceito

## 1. Origem dos itens ("Onde encontrar")

Itens sem receita (139 de 285) mostravam "nenhuma receita". Agora a página mostra **como fazer** (receitas) e/ou **onde encontrar** (origens), conforme houver dado; se não houver nenhum, uma mensagem honesta.

- Nova entidade `ItemSource` (`item-sources.json`): `kind` (`node`, `plant`, `animal-product`, `animal-droppings`, `animal-egg`), nome localizado da origem, quantidade (`min`–`max`) e `chance` (% de soltar ao menos 1).
- Fontes: `DT_Nodes` (árvores, rochas, minérios), `DT_SmallPlants` + `DT_LargePlants` (colheita) e `DT_RanchAnimals` (produto, esterco e ovo; nomes via `DT_Critters`).
- Os pesos de quantidade **não precisam somar 100**: `chance = peso(qtd>0) / peso total`.
- **Cobertura:** 90 dos 139 itens sem receita ganharam origem; **49 continuam sem** (cores/vidros, versões "Rare" de plantas, ovos especiais…). Vêm de mercadores, entregas, regiões e eventos — **fica para fatias futuras** (mercadores e regiões exigem nomes de regiões/mercadores localizados).
- **Higiene dos dados do jogo**, tudo reportado como aviso pelo `pnpm data:build` e coberto por teste:
  - 5 fontes "Wip" (conteúdo em desenvolvimento, ex.: "Magnetic Metal Ore Wip") são descartadas; nenhum item dependia só delas.
  - 1 drop referencia item inexistente (`PalmTree01 → SoftwoodLog`) e é descartado. A checagem de integridade continua estrita sobre o resultado.
  - Plantas grandes marcadas `IsNode` que já estão em `DT_Nodes` não são duplicadas.
- **Regra do dono: tudo que for "Wip" é descartado.** O filtro vale para itens (e receitas que os usam) e para origens, via `quality/unfinished.ts`; um teste de contrato falha se algum "Wip" aparecer nos JSONs commitados. Hoje só havia as 5 origens.
- Ordem na página: Como fazer → Onde encontrar → Usado em. Um item pode ter os dois primeiros.

## 2. Ícones

- **Decisão do dono:** usar o conjunto em **pixel art** (`icons_pixel`), gerado fora do repo (`icons.py`) a partir dos ícones do jogo (32 px ampliado 8× com vizinho-mais-próximo, 256×256).
- O pipeline publica **só os ícones usados** por itens em `public/icons/items/` (247 arquivos, ~1,4 MB), reconstruindo a pasta a cada execução. `Item.icon` agora é o nome do arquivo (sem `T_`, sem extensão) e só existe se o arquivo existe; senão `null` (6 itens) e a UI usa um glifo genérico.
- Um teste de contrato falha no CI se algum `item.icon` não tiver PNG publicado.
- Servidos sem otimizador de imagem (`unoptimized`) com `image-rendering: pixelated`; decorativos (`alt=""`), pois o nome sempre está ao lado.
- Os ícones têm um halo branco do original; um **tile neutro claro** (`bg-icon-tile`) nos dois temas o neutraliza.
- **Risco residual:** pixel art derivada de arte oficial continua sendo obra derivada. O gate legal (PLANO.md §7) segue obrigatório antes de abrir o repo ou lançar.

## 3. Botão primário e cores

- O primário era verde de marca com texto escuro (5,4:1). Passou a **verde mais profundo com texto branco** (`#15803d` 5,0:1; hover `#166534` 7,1:1), mesmo matiz, padrão visual mais convencional e igual nos dois temas.
- Novos tokens de marca: `--color-frontier-green-deep` e `-deeper`. Novo token semântico: `icon-tile`.
