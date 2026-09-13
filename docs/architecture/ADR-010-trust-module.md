# ADR-010 — Confiança (PRD-006)

**Estado:** ✅ Accepted  
**Data:** 2026-08-01  
**PRD:** `docs/proposals/PRD_006_CONFIANCA.md`

## Decisão

1. Módulo `modules/confianca` no Shell (`/app/confianca`).
2. Permissão `trust.manage` para client / partner / agent / admin.
3. Tabela `trust_documents` com checklist (metadados + notas); sem upload de ficheiros.
4. Revisão via `admin.panel` + RPC `review_trust_document`.
5. Sem Passaporte Digital / SCK / KTK Score / KAI neste MVP.

## Consequências

- Migration `0008_trust_prd006.sql`.
- Nav Confiança activa; home deixa de mostrar «Em desenvolvimento».
