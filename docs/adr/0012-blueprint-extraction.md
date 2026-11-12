# ADR 0012 — Dados extraídos dos Blueprints do jogo

- Status: aceito
- Complementa: ADR 0010 (origens de itens) e ADR 0011 (animais). Corrige uma afirmação do 0011.

## Contexto

Além das DataTables, o dump tem `Content/Blueprints` (classes do Unreal). Os _defaults_ de cada classe (objeto `Default__…`) guardam dados que as tabelas não têm.

## Decisão

O pipeline lê, com Zod e sem inventar nada, apenas:

- `Resources/LargeItems/BP_*.json`: o que cada item grande rende (origem `large-item`, só quando o item grande é ele mesmo um item).
- `Hazards/BP_HazardBreakable.json`: o que perigos quebráveis soltam (origem `hazard`, sem nome: o dado não nomeia o perigo).
- `Creatures/BP_LootGoblin.json`: itens das _pools_ usadas na tabela de drops (origem `loot-goblin`; quantidade e chance dependem do marco do jogador, então ficam `null`).
- `Creatures/<Id>/BP_<Id>.json` + `BP_CritterCharacter.json`: o que o bicho selvagem solta ao ser alimentado (origem `critter-feed`: recurso sempre, ovo com chance, 5%).
- `Constructs/BP_EggIncubatorConstruct.json`: chances das lentes (menor, maior, duplo, raro), dias do ovo raro e a tabela ovo → animal (`incubator.json`).

**Correção ao ADR 0011:** o ovo **não** é produzido pelo animal do rancho. Ele vem de alimentar o bicho selvagem e é chocado na incubadora; o pipeline falha se o ovo do rancho, o ovo selvagem e a tabela da incubadora divergirem. A origem `animal-egg` foi removida.

IDs de item que diferem só por maiúsculas (`SoftwoodLog` × `SoftWoodLog`) são reconciliados em vez de descartados.

## Limites

- Qual lente produz qual efeito não está nos dados: mostramos só as chances genéricas.
- Receitas de Alumínio (Frame/Parts/Electronics) continuam ausentes do jogo exportado; só entram como sobrescrita manual se o dono confirmar no jogo.
- Blueprints não são commitados (ficam em `RAW_DATA_DIR`); só o JSON curado.
