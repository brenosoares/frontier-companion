# ADR 0003 — CSP com nonce adiada para a Fase 7

- **Status:** aceito (provisório)
- **Contexto:** CSP com nonce exige renderização dinâmica (doc oficial do Next), o que conflita com o objetivo static-first.
- **Decisão:** Fase 1 entrega headers estáticos (nosniff, frame DENY, referrer, permissions, COOP, HSTS). Na Fase 7 avaliaremos CSP baseada em hashes/`'strict-dynamic'` sem perder SSG, ou aceitar render dinâmico só onde preciso.
