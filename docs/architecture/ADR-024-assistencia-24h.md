# ADR-024 — Fase D5: Assistência 24h

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-017 · ADR-018

## Context

Clientes precisam de um canal urgente, disponível 24 horas, para problemas no
imóvel. O serviço deve ser auditável e não pode criar um pagamento, saldo ou
reembolso separado da infraestrutura financeira transversal.

## Decision

A migration aditiva `supabase/migrations/0028_assistencia_24h.sql` introduz
`assistencia_requests` e `assistencia_events`. Cada pedido regista categoria,
urgência, notas e, opcionalmente, um imóvel acessível ao cliente. RLS limita a
leitura ao cliente e aos operadores; mutações passam por RPCs `security definer`.

### Máquina de estados

```text
draft → awaiting_payment → active → in_progress → completed
  └───────────────┬───────────→ cancelled
                  └───────────→ failed
```

- o cliente cria o rascunho e confirma o pagamento;
- a captura activa o pedido para operação;
- operadores com `agent.operate` ou `finance.manage` iniciam e concluem;
- o cliente pode cancelar até ao estado `active`;
- o operador pode marcar falha em `active` ou `in_progress`;
- `assistencia_events` mantém a timeline append-only.

### Pagamento

A taxa única é 5 000 AOA, cotada pelo produto `assistencia_24h.call`:

- `module_code = assistencia_24h`;
- `purpose = call_fee`;
- `reference_type = assistencia_request`;
- intent criado por `kuteka_pay_create_intent` e capturado no sandbox.

Payment intent e Ledger continuam como fontes de verdade. Não há gateway,
custódia, saldo ou reconciliação próprios; `custody_mode = none`.

### Cancelamento e reembolso

O cancelamento em `draft`, `awaiting_payment` ou `active` é sempre permitido ao
cliente. Um intent pendente é cancelado; uma taxa já capturada é devolvida
integralmente em créditos. A partir de `in_progress` o cliente já não pode
cancelar. Uma falha operacional também devolve integralmente a taxa, pois não
houve conclusão do serviço.

O helper interno `assistencia_credit_refund` reutiliza `finance_refunds`,
`finance_credit_accounts`, `finance_credit_transactions` e um lançamento de
refund no Ledger.

### RPCs e frontend

- `create_assistencia_request`, `assistencia_activate`, `assistencia_start`,
  `assistencia_complete`, `assistencia_cancel`, `assistencia_fail` e
  `assistencia_my_context`;
- schemas Zod em `packages/validation/src/assistencia.ts`;
- cliente com resultado `{ ok, data/message }` em `assistencia-client.ts`;
- `/app/assistencia` usa `SessionStatusGate` e `SoftListSlot`, com criação,
  pagamento, operação, cancelamento, badges e timeline;
- o shell e o Finance Hub ligam à Assistência 24h;
- a flag `assistencia_24h` interrompe novos pedidos e novos pagamentos.

## Consequences

- Assistência 24h torna-se um produto urgente auditável na stack comum.
- Cancelamentos elegíveis preservam o valor do cliente em créditos Kuteka.
- Dispatch automático, integração telefónica e gateway real ficam fora do D5;
  a troca de gateway continua a ser configuração do Kuteka Pay.
