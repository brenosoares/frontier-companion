# ADR 0002 — Dados estáticos validados em build

- **Status:** aceito
- **Decisão:** JSONs brutos (fora do repo, via `RAW_DATA_DIR`) passam por um pipeline que valida (Zod), sanitiza e normaliza, emitindo dados tipados consumidos por repositórios (`XRepository`). Sem banco/API pública no MVP.
- **Por quê:** menor superfície de ataque, custo ~zero, desempenho. Repositórios atrás de interface permitem trocar a fonte depois (DIP).
- **Dados brutos e ícones oficiais:** não entram no git até o gate legal (PLANO.md §7).
