# ADR-016 — Monetização Fase 3 (serviços comerciais)

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-015 · Manual «Como Render com a Kuteka»

## Context

Phase 1 delivered Ledger, catalog, pricing, Pay sandbox, credits, invoices and `/app/super`.
Phase 3 activates revenue modules without custody/escrow: Smart Move, marketplace take-rate,
partner plans, rent reminders, and Super Admin service-health flags.

## Decision

1. **Mudança Inteligente** (`smart_move_requests` + `create_smart_move_request`)
   - Opening fee via `finance_create_sandbox_payment('smart_move.open')` + auto-capture
   - Optional contract exit intent via existing `set_contract_exit_intent`
   - Status pipeline: draft → awaiting_payment → active → matched → completed
   - UI: `/app/mudanca`

2. **Marketplace prestadores** (`service_providers`, `service_orders`, `create_service_order`)
   - Commission ledger entry (`custody_mode = none`, payer=provider)
   - Demo providers seeded; UI `/app/servicos`

3. **Planos Parceiro** (`partner_plan_subscriptions`, `activate_partner_plan`)
   - Bronze / Silver / Gold monthly products already in catalog
   - UI `/app/parceiro/planos` (requires `properties.manage`)

4. **Lembretes de renda** (`payment_reminders`, `schedule_rent_reminders`)
   - Offsets D-5, D-3, D-1, D0, late · channel in_app first
   - Visible in `/app/financeiro`

5. **Service Health** (`platform_feature_flags`, `set_feature_flag`)
   - Super Admin toggles modules without deploy

## Consequences

- Additive only (Core v1 freeze respected)
- No wallet/escrow; money stays with recipient gateways in future commercial phase
- Static export includes new routes under `prebuilt/web-out`
