# ADR-008 — Agente Certificado (PRD-004)

**Estado:** ✅ Accepted  
**Data:** 2026-08-01  
**PRD:** `docs/proposals/PRD_004_AGENTE.md`

## Decisão

1. Módulo `modules/agente` — preferências, discovery, Activar Acompanhamento.
2. Permissão `agent.operate` para `certified_agent` + `administrator`.
3. Papel continua **não** self-serve (atribuído pela Kuteka).
4. Tabelas `agent_preferences` + `agent_assignments`; RLS discovery em patrimónios `active`.
5. Sem visitas, Passaporte, KAI ou Academia neste MVP.

## Consequências

- Nav / painel: Agente activo.
- Migration `0006_agent_prd004.sql`.
