# ADR 0004 — Pipeline de dados: decisões da Fase 2

- **Status:** aceito
- **Contexto:** o dump é de Unreal Engine (ver `docs/data-inventory.md`): structs com GUID, enums como `EItemTag::Oil`, textos em FText, tabelas redundantes.

## Decisões

1. **Receitas: fonte única = `DT_CompositeRecipes`.** Verificado: é a união exata das ~29 tabelas por máquina (mesmo corpo, 0 divergências). As tabelas por máquina são lidas só para derivar `stations` (onde a receita é feita). Evita duplicação (DRY).
2. **Nomes limpos por função genérica** (`normalizeKeys` remove `_<índice>_<GUID>`), não por mapa manual: resiste a mudanças de GUID entre patches. Colisões de chave quebram o build.
3. **Enums viram strings Pascal** (`Oil`) sem `z.enum` fechado: um novo patch com tag nova não quebra o build; o formato é validado por regex. Enums ilegíveis (`NewEnumerator0`) serão mapeados à mão quando a entidade correspondente entrar.
4. **Feature flags: todo conteúdo é emitido com `featureFlag`**; a UI oculta o que tiver flag por padrão (decisão do dono). O dump **não diz** quais flags estão ativas (`DT_FeatureFlags` é só uma lista). Se quisermos exibir flags já lançadas (ex.: `RanchAnimals`, `Neighbours`), será uma allowlist explícita, decidida pelo dono.
5. **Sem `description` quando vazia** (`null`), nunca string vazia; `name` é obrigatório em en e pt-BR.
6. **Dependências de entrada/saída por porta** (`RawTableSource`): produção lê do disco, testes usam memória.
7. **Saída determinística** (ordenada por id, `dataVersion` = hash do conteúdo): diffs de patch ficam legíveis.
8. **`data/processed` é o NOSSO JSON curado e é versionado** (revisão do dono, posterior à decisão inicial de ignorá-lo). O dump bruto nunca entra no repo. Um teste de contrato roda no CI sobre os arquivos commitados (schemas, integridade, strings sensíveis, versão do jogo); os testes do pipeline usam fixtures sintéticas (inventadas).
9. **Scripts em `tsx`** (sem build step), importando os schemas de `src/features/*/domain` — uma só fonte de tipos.

## Consequências

- O app (Fase 4) lê `data/processed` direto do repo: o deploy **não** precisa do dump.
- Atualizar para um patch novo = rodar `pnpm data:build` localmente com o novo dump, revisar o diff do JSON e commitar. O diff do JSON é o changelog do patch.
- **Risco residual (não eliminado):** o JSON curado reproduz nomes e descrições do jogo. Expor menos que o dump (sem paths, EULA, falas, estrutura interna) reduz a exposição, mas não resolve a questão de propriedade intelectual. O gate legal (PLANO.md §7) continua obrigatório antes de tornar o repo público ou lançar o site.
