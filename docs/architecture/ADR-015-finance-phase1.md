# ADR-015 — Arquitectura financeira Fase 1 (Ledger / Kuteka Pay / Super Admin)

## Status

Accepted — 2026-08-05

## Context

A monetização B2B2C exige infraestruturas antes dos serviços visíveis (Mudança Inteligente, marketplace, etc.). O PO aprovou a Arquitetura Financeira v1.0 e a ordem Fase 1 → 2 → 3, com **sem custódia de fundos** nesta fase.

## Decision

1. Migration `0019_finance_phase1.sql`: produtos, regras de preço, comissões, gateways, ledger, payment intents, créditos, faturas, consentimentos, campanhas.
2. Permissões `finance.manage` (Super Admin) e `finance.read` (Admin + Super).
3. Painel `/app/super` — Revenue Command Center.
4. Hub utilizador `/app/financeiro` — serviços opcionais + faturas (sandbox).
5. RPCs: `finance_quote_price`, `finance_create_sandbox_payment`, `finance_capture_sandbox_payment`, `finance_grant_credits`, `finance_revenue_snapshot`.
6. `custody_mode = none` por defeito; escrow só no futuro.

## Consequences

- Preços editáveis sem código (Super Admin).
- Gateways em sandbox até conta comercial Multicaixa/EMIS/Stripe.
- Fase 3 (Mudança Inteligente completa, rede prestadores) reutiliza este motor.
