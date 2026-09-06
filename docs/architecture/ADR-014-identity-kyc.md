# ADR-014 — Identidade Real (KYC)

## Status

Accepted — 2026-08-04

## Context

A plataforma gere património, arrendamento, venda e contratos. Um perfil com apenas `display_name` é insuficiente. A Confiança (PRD-006 / ADR-010) cobria checklist sem ficheiros nem dados legais.

## Decision

1. **Perfil completo** em `/app/perfil` (identidade, documento com upload, foto, contactos, morada, bancário opcional).
2. **Níveis KYC 0–4** + **Índice de Confiança** em `profiles`, recalculados por `recompute_profile_kyc`.
3. **Storage privado** `identity-documents` + auditoria `identity_access_logs`.
4. **Snapshot contratual** via `get_identity_party_snapshot` para preencher partes em contratos/facturas.
5. **Gate**: contratos reais (não demo) exigem KYC ≥ 2 para cliente e parceiro.
6. Visitantes navegam; acções contratuais exigem identidade verificada.

## Consequences

- ADR-010 permanece válido para o checklist Confiança; upload de BI/morada passa a ser extensão KYC.
- Agentes/admin podem ler snapshot com audit log.
- Encriptação em trânsito/repouso: TLS + Storage privado Supabase (v1). Cifra cliente-lado fica para iteração futura.
