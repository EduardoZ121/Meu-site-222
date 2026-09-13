# Finanças Kuteka

Documentação oficial da monetização e arquitectura financeira.

| Documento                                                                        | Formato  | Descrição                 |
| -------------------------------------------------------------------------------- | -------- | ------------------------- |
| [ARQUITETURA_FINANCEIRA_KUTEKA.md](./ARQUITETURA_FINANCEIRA_KUTEKA.md)           | Markdown | Fonte canónica (v1.0)     |
| [Arquitetura_Financeira_Kuteka_v1.docx](./Arquitetura_Financeira_Kuteka_v1.docx) | Word     | Para descarregar / editar |
| [Arquitetura_Financeira_Kuteka_v1.pdf](./Arquitetura_Financeira_Kuteka_v1.pdf)   | PDF      | Para partilhar / imprimir |

**Decisões PO (2026-08-05):** B2B2C · Fase 1 sem escrow · híbrido Grátis + Pay-per-use + Plus · Super Admin em `/app/super` · gateways em sandbox até conta comercial.

## Implementação Fase 1

- Migration: `supabase/migrations/0019_finance_phase1.sql`
- ADR: `docs/architecture/ADR-015-finance-phase1.md`
- Super Admin: `/app/super`
- Hub utilizador: `/app/financeiro`
- Demo Super: `demo.super@kuteka.local` / `DemoKuteka2026!`

## Ordem do roteiro (nova ordem PO 2026-08-05)

Antes de mais serviços de negócio, consolidamos a **infraestrutura financeira
transversal** — genérica e reutilizável, sem soluções isoladas e sem custódia
(`custody_mode = none`).

- **Fase A — Consolidação (entregue)**
  - Migration: `supabase/migrations/0021_finance_infra_fase_a.sql`
  - ADR: `docs/architecture/ADR-017-finance-infra-fase-a.md`
  - Reembolsos, disputas, reconciliação, fraude, regras KAI, CRM financeiro,
    exportações contabilísticas, faturas com PDF/numeração e redimir créditos.
  - Super Admin reorganizado num Command Center por separadores (config-first).
- **Fase B — Kuteka Pay: motor de pagamento unificado (esta entrega)**
  - Migration: `supabase/migrations/0022_kuteka_pay_engine.sql`
  - ADR: `docs/architecture/ADR-018-kuteka-pay-engine.md`
  - Uma só arquitectura de pagamento para **todos** os módulos (renda, reservas,
    mudança inteligente, concierge, contratos, avaliações, prestadores, futuros).
  - Payment intent como fonte de verdade; `module_code` / `purpose` /
    `reference_type` / `reference_id` ligam qualquer objecto de negócio.
  - RPCs `kuteka_pay_create_intent`, `kuteka_pay_capture`, `kuteka_pay_fail`,
    `kuteka_pay_cancel`, `kuteka_pay_status`, `kuteka_pay_simulate_webhook`,
    `kuteka_pay_adapter_health`, `kuteka_pay_set_default_gateway`.
  - `finance_create_sandbox_payment` / `finance_capture_sandbox_payment` passam a
    **wrappers** sobre o motor (callers antigos continuam a funcionar).
  - Adaptadores: `sandbox|multicaixa|emis|stripe|wise|bank_transfer` (só sandbox
    activo nesta fase; trocar de gateway é configuração, não código de módulo).
  - Super Admin: novo separador **Kuteka Pay** (saúde de adaptadores, simular
    webhook, gateway por omissão).
- **Fase C — Marketplace Operacional (esta entrega)**
  - Migration: `supabase/migrations/0023_marketplace_ops.sql`
  - ADR: `docs/architecture/ADR-019-marketplace-ops.md`
  - Fecha o ciclo do prestador: pedido → orçamento → aceitação → execução →
    **pagamento via Kuteka Pay** → avaliação → **comissão no Ledger** → SLA →
    histórico. Nenhum caminho de pagamento isolado.
  - `service_orders` ganha orçamento, SLA e avaliação; `service_order_events` é a
    timeline append-only.
  - RPCs `marketplace_create_order`, `marketplace_submit_quote`,
    `marketplace_accept_quote`, `marketplace_start_order`,
    `marketplace_complete_order`, `marketplace_pay_order`,
    `marketplace_cancel_order`, `marketplace_rate_order`,
    `marketplace_check_slas`, `marketplace_my_context`,
    `marketplace_list_providers`.
  - `kuteka_pay_create_intent` ganha `p_amount_override` (genérico) para cobrar o
    valor negociado mantendo o intent como fonte de verdade.
  - Produto genérico `marketplace.service` (valor real via override do orçamento).
  - UI `/app/servicos` por separadores: Prestadores | Os meus pedidos | Pedidos
    recebidos. Prestadores demo operáveis por `demo.parceiro` ou `finance.manage`.
- **Fase D1 — Mudança Inteligente N5 (esta entrega)**
  - Migration: `supabase/migrations/0024_smart_move_n5.sql`
  - ADR: `docs/architecture/ADR-020-smart-move-n5.md`
  - Fecha o ciclo da Mudança Inteligente sobre a **mesma** infraestrutura
    (Ledger + Kuteka Pay + reembolsos/créditos). Nenhum caminho isolado.
  - Estados: `draft → awaiting_payment → active → matched → completed |
cancelled | failed`.
  - Pagamentos: **abertura** (`opening_fee`) no arranque; **sucesso**
    (`success_fee`) só quando a Kuteka encontra solução aceite — ambos via
    `kuteka_pay_create_intent` (`module_code = smart_move`,
    `reference_type = smart_move_request`).
  - Reembolsos por urgência em créditos: falha devolve 50–100 % da abertura;
    cancelamento antes do match devolve 100 % — via tabelas `finance_refunds` +
    `finance_credit_*` (helper interno `smart_move_credit_refund`).
  - SLA de matching por urgência (720/480/240/120 h);
    `smart_move_check_slas` marca breaches.
  - `smart_move_events` — timeline append-only (padrão `service_order_events`).
  - RPCs `create_smart_move_request` (refactor Kuteka Pay), `smart_move_match`,
    `smart_move_accept_match`, `smart_move_reject_match`, `smart_move_fail`,
    `smart_move_cancel`, `smart_move_check_slas`, `smart_move_my_context`.
  - UI `/app/mudanca`: badges de estado, montantes abertura/sucesso, cronologia;
    cliente aceita/recusa/cancela, operador (`agent.operate`/`finance.manage`)
    regista match e falha por SLA.
- **Fase D2 — Encontrar Casa (entregue)**
  - Migration: `supabase/migrations/0025_find_home.sql`
  - ADR: `docs/architecture/ADR-021-find-home.md`
  - Procura prioritária assistida com uma única taxa (`priority_fee`) pelo motor
    Kuteka Pay; sem cobrança ao aceitar e sem caminho de pagamento isolado.
  - Estados: `draft → awaiting_payment → active → matched → completed |
cancelled | failed`; timeline append-only em `find_home_events`.
  - Falha e cancelamento elegível geram reembolso integral pela infraestrutura
    transversal de reembolsos/créditos; `custody_mode = none`.
  - UI `/app/encontrar-casa`: criação, badges/SLA, cronologia, acções de cliente
    e operação de match/falha.
- **Fase D3 — Concierge Kuteka (entregue)**
  - Migration: `supabase/migrations/0026_concierge.sql`
  - ADR: `docs/architecture/ADR-022-concierge.md`
  - Serviço pay-per-use com taxa única `service_fee` pelo produto
    `concierge.request`, via `kuteka_pay_create_intent` (`module_code =
concierge`, `reference_type = concierge_request`).
  - Estados: `draft → awaiting_payment → active → in_progress → completed |
cancelled | failed`; timeline append-only em `concierge_events`.
  - Cliente cria com categoria/notas e imóvel/contrato opcionais. Operadores com
    `agent.operate` ou `finance.manage` iniciam e concluem o atendimento.
  - Cancelamento antes de `in_progress` e falha operacional devolvem 100% da
    taxa em créditos pela stack transversal; `custody_mode = none`.
  - UI `/app/concierge`: criação, badges, cronologia, acções de cliente/operação,
    `SessionStatusGate` e `SoftListSlot`; links no shell e no Finance Hub.
- **Fase D4 — Garantia Kuteka (entregue)**
  - Migration: `supabase/migrations/0027_garantia.sql`
  - ADR: `docs/architecture/ADR-023-garantia-kuteka.md`
  - Subscrição opcional de 3 500 AOA/mês pelo produto `garantia.monthly`, sem
    caminho de pagamento isolado.
  - Activação via `kuteka_pay_create_intent` (`module_code = garantia`,
    `purpose = subscription`, `reference_type = garantia_subscription`) e
    registo no Ledger transversal.
  - Estados: `draft → awaiting_payment → active → cancelled | past_due |
failed`; timeline append-only em `garantia_events`.
  - Cancelamento em `awaiting_payment` ou no mesmo dia UTC da activação devolve
    100% em créditos; depois termina a cobertura sem reembolso nem pró-rata.
  - UI `/app/garantia`: rascunho, activação, cancelamento, badges e cronologia,
    com `SessionStatusGate`, `SoftListSlot`, link no shell e no Finance Hub.
- **Fase D5 — Assistência 24h (entregue)**
  - Migration: `supabase/migrations/0028_assistencia_24h.sql`
  - ADR: `docs/architecture/ADR-024-assistencia-24h.md`
  - Chamada urgente por 5 000 AOA através do produto `assistencia_24h.call`,
    sem pagamentos ou saldos próprios.
  - Activação via `kuteka_pay_create_intent` (`module_code = assistencia_24h`,
    `purpose = call_fee`, `reference_type = assistencia_request`) e registo no
    Ledger transversal.
  - Estados: `draft → awaiting_payment → active → in_progress → completed |
cancelled | failed`; timeline append-only em `assistencia_events`.
  - O cliente cria com categoria, urgência, notas e imóvel opcional; operadores
    iniciam e concluem a assistência.
  - Cancelamento antes de `in_progress` devolve 100% da taxa em créditos.
  - UI `/app/assistencia`: criação, pagamento, operação, badges e cronologia,
    com `SessionStatusGate`, `SoftListSlot`, link no shell e no Finance Hub.
- **Fase D1–D5 (primeiro conjunto comercial) — concluída** (2026-08-05).
- **Fase comercial restante (não confundir com D1–D5):** gateways reais +
  custódia/escrow opcional e automação de payouts.
- **Fase E — Conformidade AGT/SAF-T** sobre as exportações da Fase A.

As fases comerciais restantes e a Fase E assentam sobre A/B/C/D1–D5.

**Visão global (pós–Fase D):**  
[KUTEKA ROADMAP MASTER](../product/KUTEKA_ROADMAP_MASTER.md) — plataforma.  
[KUTEKA OPERATING SYSTEM (KOS)](../product/KUTEKA_OPERATING_SYSTEM.md) — operação
empresarial e versões comerciais **v1.0 → v3.0**.
