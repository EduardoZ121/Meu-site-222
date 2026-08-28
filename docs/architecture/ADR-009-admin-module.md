# ADR-009 — Administração (PRD-005)

**Estado:** ✅ Accepted  
**Data:** 2026-08-01  
**PRD:** `docs/proposals/PRD_005_ADMINISTRACAO.md`

## Decisão

1. Módulo `modules/administracao` no Shell (`/app/admin`).
2. Gate existente `admin.panel` (sem nova permissão).
3. RLS alargada para admin em `profiles` / `user_roles`.
4. RPC `assign_certified_agent` + `admin_platform_stats`.
5. Sem Passaporte / KAI / BI neste MVP.

## Consequências

- Migration `0007_admin_prd005.sql`.
- Substitui o stub `AdminPanelClient` por hub operacional.
