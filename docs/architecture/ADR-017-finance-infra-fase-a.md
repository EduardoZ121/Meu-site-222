# ADR-017 — Fase A: Consolidação da Infraestrutura Financeira

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-015 · ADR-016 · nova ordem PO 2026-08-05

## Context

As Fases 1 (ADR-015) e 3 (ADR-016) entregaram ledger, catálogo, preços, Kuteka Pay
(sandbox), créditos, faturação, comissões, marketplace e planos. O PO reordenou o
roteiro: antes de mais serviços de negócio, é preciso **consolidar a infraestrutura
financeira transversal** — genérica e reutilizável por qualquer serviço futuro, sem
soluções isoladas. A custódia mantém-se desligada (`custody_mode = none`): sem
wallet, sem escrow.

## Decision

Migration `supabase/migrations/0021_finance_infra_fase_a.sql` adiciona, de forma
aditiva (Core v1 freeze respeitado):

### Esquema

- **Ledger**: novos `entry_type` (`chargeback`, `dispute_hold`, `reversal`) e
  `status` (`disputed`, `reversed`, `reconciled`).
- **Créditos**: nova direcção `refund_credit` em `finance_credit_transactions`.
- **Faturação**: `finance_invoices` ganha `pdf_html`, `pdf_generated_at`,
  `email_sent_at`, `email_to`, `sequence_year`, `sequence_number`, `void_reason`;
  nova tabela `finance_invoice_sequences` (numeração por país/ano).
- **Reembolsos** (`finance_refunds`): modos `credits | gateway | adjustment`.
- **Disputas** (`finance_disputes`) e retenções via `dispute_hold`.
- **Reconciliação** (`finance_reconciliation_runs` + `finance_reconciliation_items`).
- **Fraude** (`finance_fraud_flags`).
- **Regras KAI** (`finance_kai_rules`) — motor de sugestões comerciais opt-in.
- **CRM financeiro** (`finance_crm_accounts`) — parceiro/prestador/empresa/investidor,
  com FK opcional a `service_providers`.
- **Exportações** (`finance_accounting_exports`) — CSV/JSON, base para SAF-T/AGT.

Todas as tabelas com RLS: escrita `finance.manage`, leitura `finance.read`
(e o próprio utilizador quando aplicável).

### RPCs (security definer, grant a `authenticated`)

`finance_redeem_credits`, `finance_create_refund`, `finance_open_dispute`,
`finance_run_reconciliation`, `finance_generate_invoice_pdf`,
`finance_mark_invoice_emailed`, `finance_upsert_product`, `finance_set_commission`,
`finance_upsert_kai_rule`, `finance_flag_fraud`, `finance_resolve_fraud`,
`finance_upsert_crm_account`, `finance_create_accounting_export`,
`finance_my_credit_balance`, e a substituição de `finance_revenue_snapshot`
(agora inclui `refunds`, `openDisputes`, `openFraud`, `crmAccounts`, `kaiRules`).

> **Nota de segurança:** `finance_create_refund` em modo `credits` chama
> `finance_grant_credits` **directamente**. Essa função valida `finance.manage`
> sobre `auth.uid()`, que o Super Admin já possui — sem truques de `set_config`/JWT.

### Seeds

Produtos transversais (`concierge.request`, `garantia.monthly`,
`assistencia_24h.call`, `avaliacao.imovel`, `reserva.visita`, `destaque.listing`,
`partner.platinum.monthly`) com regras de preço; regras KAI base
(`exit_intent_smart_move`, `maintenance_marketplace`, `partner_upgrade`); contas CRM
a partir dos `service_providers` existentes; sequência de faturação AO do ano corrente.

### Frontend

- `packages/validation`: schemas Zod para todos os novos RPCs.
- `apps/web/modules/finance/services/finance-client.ts`: helpers de listagem/criação
  para todas as entidades novas (browser clients devolvem `{ ok, data/message }`).
- Super Admin reorganizado num **Command Center por separadores**
  (`SuperCommandCenter.tsx` como shell) com secções em
  `modules/finance/components/super/`: Revenue, Catalog, Pricing, Credits, Refunds,
  Disputes, Recon, Fraud, KaiRules, Crm, Export, Invoices, Gateways, FeatureFlags,
  Campaigns. Config-first: o Super Admin cria produtos, define comissões, alterna
  campanhas/flags, concede/redime créditos, cria reembolsos, abre disputas, corre
  reconciliação, gera PDF de fatura, exporta contabilidade e gere KAI/CRM.
- `FinanceHubClient.tsx`: saldo de créditos, redimir, gerar/descarregar fatura (blob
  HTML) e listar reembolsos do utilizador.

## Consequences

- Infraestrutura genérica: novos serviços reutilizam ledger, reembolsos, disputas,
  reconciliação, fraude, KAI, CRM e exportações sem duplicar esquema.
- Sem custódia/escrow; o dinheiro segue para os gateways dos destinatários numa fase
  comercial futura.
- **Ordem do roteiro:** Fase A (esta) consolida a base; Fases B/C/D seguintes
  (integração de gateways reais, escrow opcional, SAF-T/AGT e automação de payouts)
  só arrancam sobre esta fundação.
- Export estático inclui as secções novas em `prebuilt/web-out`.
