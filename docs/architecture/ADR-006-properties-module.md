# ADR-006 — Properties / Ativar Património (PRD-002)

**Estado:** ✅ Accepted  
**Data:** 2026-08-01  
**PRD:** `docs/proposals/PRD_002_PARCEIRO_PATRIMONIAL.md`

## Decisão

1. Tabela `public.properties` com RLS (dono + admin).
2. Permissão `properties.manage` para `patrimonial_partner` e `administrator`.
3. UI em `modules/patrimonios` dentro do Shell; rotas `/app/patrimonios*`.
4. Detalhe via query `?id=` (static-export safe).
5. Sem marketplace, Passaporte, documentos ou KAI neste MVP.

## Consequências

- Nav Shell: Patrimónios activo.
- Migration `0004_properties_prd002.sql` no remoto.
- Extensível a documentos/Passaporte em PRDs futuros.
