# Inventário de dados — Fase 0

Fonte: `d:\projects\frontier-companion-data-raw\FarMech\Content` (fora do repositório, de propósito).
Origem: dump de Unreal Engine (projeto interno `FarMech` = Lightyear Frontier), exportado com ferramenta tipo FModel.

## Números

| Tipo                           | Qtde            | Observação                                                                                                  |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------- |
| JSON                           | 162             | ~7 MB de DataTables + ~1,2 MB de localização                                                                |
| PNG (ícones de UI)             | 1103 (~17,7 MB) | Todos em `Graphics/UI/Icons`. Sem modelos 3D, texturas de mundo ou áudio                                    |
| Ícones referenciados nos JSONs | 1146            | **112 não existem** nos PNGs (maioria peças de construção: vigas, banheira…); 69 PNGs não são referenciados |

## Formato

- Cada `DT_*.json` é uma lista com 1 objeto `DataTable` e um dicionário `Rows` (chave = ID estável, ex.: `AdvancedFuel1`).
- Textos vêm como `{ SourceString (EN), LocalizedString (pt-BR), Key, Namespace }` → **en + pt-BR já nos dados**, sem tradução manual. Alguns campos têm `CultureInvariantString: null` (sem texto).
- Structs "UserDefinedStruct" têm campos com **sufixo de GUID** (ex.: `Time_15_23C41772…`) → o pipeline precisa de um mapa de renomeação para nomes limpos.
- Enums vêm como `EItemTag::Oil`, `ConstructType::NewEnumerator0` (alguns enums são ilegíveis: `NewEnumerator0`, `PatchType::NewEnumerator0`) → exigem tabela de tradução manual.
- Referências cruzadas por ID textual (receita `Input: [{Key: "CopperOre", Value: 1}]` → `DT_Items`).
- Ícone: `Icon.AssetPathName = /Game/Graphics/UI/Icons/T_X.T_X` → arquivo `T_X.png`.

## Entidades candidatas ao MVP (por valor ao jogador)

| Entidade                        | Arquivo(s)                                                                                         | Linhas                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Itens                           | `DT_Items`                                                                                         | 285                                   |
| Construções / Constructs        | `DT_Constructs`                                                                                    | 565                                   |
| Receitas (agregadas)            | `DT_CompositeRecipes` + ~35 `DT_*Recipe(s)` por máquina (Furnace, Grinder, OilPresser, SeedMaker…) | 362 no composto                       |
| Desbloqueio de receitas         | `DT_RecipeUnlocks`                                                                                 | —                                     |
| Módulos do mecha                | `DT_Modules`                                                                                       | 284                                   |
| Mecha (partes, chips)           | `DT_Modules`, `DT_CoreUpgrades`, `DT_StatDisplay` (`DT_Upgrades` é legado, ver ADR 0014)           | 284 / 144 / 37                        |
| Plantas e sementes              | `DT_SmallPlants`, `DT_LargePlants`, `DT_PlantToSeed`, `DT_SeedToPlant`, `DT_RarePlantData`         | 13 / —                                |
| Nodes (árvores, rochas) e drops | `DT_Nodes`                                                                                         | 75                                    |
| Criaturas / Rancho              | `DT_Critters`, `DT_RanchAnimals`, `DT_CritterFood`                                                 | —                                     |
| Missões                         | `DT_Quests`                                                                                        | 76                                    |
| Entregas / Planetas             | `DT_Deliveries`, `DT_PlanetDelivery*`, `DT_Agreements`                                             | —                                     |
| Comerciantes                    | `DT_MerchantBundles`, `DT_MerchantBundleEntries`                                                   | —                                     |
| Clima, calendário               | `DT_Weather`, `CalendarTable`                                                                      | —                                     |
| Conquistas                      | `DT_Achievements`                                                                                  | —                                     |
| Patch notes                     | `DT_PatchNotes`                                                                                    | **vazio** nos dados (notas em branco) |

## Ignorar no MVP (ruído de UI / engine)

`RichTextStyles/*`, `TextDecorators/*`, `DT_ButtonDecorator`, `DT_ButtonImages`, `GamepadImageTable`, `FeatureFlags`, `WeatherLightingOverridePresets`, `Name.json`, `String.json`, `BP_RichTextBlock`, `DT_Upgrades_OLD`, os `F*.json` (definições de struct, úteis só para entender campos).
`ST_VOText` (490 KB, falas de áudio) e `DT_AdditionalSpeechLineData` (244 KB): conteúdo narrativo/direitos autorais — fora do escopo.

## Riscos / pontos de atenção encontrados

1. **Feature flags** (`Features.LargeItemsAndMechHauling` …): há itens/conteúdo possivelmente **não lançados**. Decidir se exibimos (spoiler / conteúdo cortado) — o pipeline deve poder filtrar.
2. **Texto de EULA/termos do jogo** em `DT_Agreements` (contém e-mails e URLs do estúdio): **não** publicar; excluir do pipeline.
3. **Strings com padrão de caminho Windows/URL/e-mail** em `Game.json`, `DT_Upgrades`, `DT_Tooltips` etc.: provavelmente falsos positivos (rich text, escapes), mas o pipeline deve ter um _scanner de sanitização_ (falha o build se achar caminho local, e-mail, token).
4. **Spoilers**: missões, lore e `DT_ArtifactLoreEntries` — decidir se ficam atrás de "mostrar spoilers".
5. **Dados duplicados/legados**: `DT_Upgrades_OLD`, `DT_*Recipes` vs `DT_CompositeRecipes` (provável sobreposição → deduplicar, DRY).
6. **Ícones faltando (112)**: precisamos de _fallback_ (`NoIcon.png` / placeholder) e teste que lista os faltantes.
7. **Idiomas**: só `pt-BR` na pasta de localização; EN vem de `SourceString`. Outros idiomas não disponíveis.
8. **Propriedade intelectual**: os 1103 PNGs são **arte oficial do jogo**; dados numéricos e textos também. Ver decisão abaixo.
