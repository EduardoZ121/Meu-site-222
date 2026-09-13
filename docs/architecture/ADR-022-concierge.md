# ADR-022 — Fase D3: Concierge Kuteka

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-017 · ADR-018 · ADR-020 · ADR-021

## Context

Clientes precisam de apoio à medida para situações que não cabem num fluxo
automatizado. O Concierge deve ser pay-per-use sem criar outra infraestrutura
financeira, custódia ou uma operação sem rastreabilidade.

## Decision

A migration aditiva `supabase/migrations/0026_concierge.sql` introduz
`concierge_requests` e `concierge_events`. O cliente cria um pedido com categoria,
notas e referências opcionais a imóvel/contrato. RLS restringe a leitura ao cliente
ou a operadores com `agent.operate` / `finance.manage`; todas as mutações passam por
RPCs `security definer`.

### Máquina de estados

```text
draft → awaiting_payment → active → in_progress → completed
                              │          └──────→ failed
                              └───────────────→ cancelled
```

- o cliente cria e pode cancelar em `draft`, `awaiting_payment` ou `active`;
- um operador inicia `active → in_progress` e conclui
  `in_progress → completed`;
- um operador pode marcar `active | in_progress → failed`;
- `concierge_events` regista a timeline append-only.

### Pagamento e reembolso

A taxa única `service_fee` usa o produto já existente `concierge.request`:

- `module_code = concierge`;
- `purpose = service_fee`;
- `reference_type = concierge_request`;
- payment intent criado por `kuteka_pay_create_intent` e capturado no sandbox.

O payment intent e o Ledger continuam como fonte de verdade. Cancelar antes do
início do atendimento devolve 100% da taxa em créditos Kuteka. Uma falha operacional
também devolve 100%, porque o serviço não foi concluído. O helper interno
`concierge_credit_refund` reutiliza `finance_refunds`, `finance_credit_accounts`,
`finance_credit_transactions` e um lançamento de refund no Ledger. A cobrança é
bloqueada durante o reembolso, tornando a operação idempotente por estado.

`custody_mode = none`; não existe escrow nem retenção de fundos.

### RPCs e frontend

- `create_concierge_request`, `concierge_start`, `concierge_complete`,
  `concierge_cancel`, `concierge_fail` e `concierge_my_context`;
- schemas Zod em `packages/validation/src/concierge.ts`;
- cliente com resultado `{ ok, data/message }` em `concierge-client.ts`;
- `/app/concierge` usa `SessionStatusGate` e `SoftListSlot`, com formulário,
  badges, timeline e acções por actor;
- o shell e o Finance Hub ligam ao Concierge.

## Consequences

- Concierge torna-se um serviço auditável sobre a stack partilhada.
- A política de cancelamento é simples: antes de `in_progress`, reembolso integral.
- Operadores usam permissões existentes; não é introduzido um novo papel.
- Gateways reais, custódia e automação externa continuam fora desta fase.
