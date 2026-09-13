# ADR-007 — Habitação / Cliente (PRD-003)

**Estado:** ✅ Accepted  
**Data:** 2026-08-01  
**PRD:** `docs/proposals/PRD_003_CLIENTE.md`

## Decisão

1. Domínio UI **Habitação** (`modules/habitacao`) — complementa inventário do PRD-002.
2. Permissão `housing.explore` para `client` e `administrator`.
3. RLS SELECT adicional em `properties` para patrimónios `active`.
4. Tabela `client_preferences` (finalidade, província, cidade).
5. Detalhe via `?id=`; sem notas do parceiro, Passaporte, KAI ou Confiança.

## Consequências

- Nav Shell: Habitação activo.
- Migration `0005_housing_prd003.sql`.
- Extensível a visitas / propostas / Passaporte em PRDs futuros.
