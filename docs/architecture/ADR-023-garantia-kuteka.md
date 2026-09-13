# ADR-023 — Fase D4: Garantia Kuteka

**Status:** Accepted  
**Date:** 2026-08-05  
**Ref:** Arquitectura Financeira v1.0 · ADR-017 · ADR-018

## Context

Clientes e parceiros precisam de uma protecção mensal opcional associável a um
arrendamento. A Garantia não pode criar pagamentos, saldo ou reembolsos isolados
da infraestrutura financeira transversal.

## Decision

A migration aditiva `supabase/migrations/0027_garantia.sql` introduz
`garantia_subscriptions` e `garantia_events`. A subscrição pode referenciar um
imóvel e um contrato acessível ao cliente. RLS limita a leitura ao cliente e a
Finanças; mutações passam por RPCs `security definer`.

### Máquina de estados

```text
draft → awaiting_payment → active → cancelled
                            ├─────→ past_due
                            └─────→ failed
```

- o cliente cria o rascunho e activa-o;
- a activação solicita e captura a mensalidade no sandbox;
- o cliente ou Finanças cancela a cobertura;
- Finanças pode marcar `past_due` ou `failed`;
- `garantia_events` mantém a timeline append-only.

### Pagamento

A mensalidade N5 é 3 500 AOA, cotada pelo produto `garantia.monthly`:

- `module_code = garantia`;
- `purpose = subscription`;
- `reference_type = garantia_subscription`;
- intent criado por `kuteka_pay_create_intent` e capturado no sandbox.

Payment intent e Ledger continuam como fontes de verdade. Não há gateway,
custódia, saldo ou reconciliação próprios da Garantia; `custody_mode = none`.

### Cancelamento e período de graça N5

Para manter a regra simples e verificável, usamos o dia UTC da activação:

- em `awaiting_payment`, um valor já capturado é devolvido integralmente em
  créditos; um intent ainda pendente é cancelado;
- em `active`, cancelamento no mesmo dia UTC de `coverage_starts_at` devolve
  100% da mensalidade em créditos;
- depois desse dia, o cancelamento termina imediatamente a cobertura e não há
  reembolso nem pró-rata;
- `past_due` pode ser cancelada sem reembolso.

O helper interno `garantia_credit_refund` reutiliza `finance_refunds`,
`finance_credit_accounts`, `finance_credit_transactions` e um lançamento de
refund no Ledger.

### RPCs e frontend

- `create_garantia_subscription`, `garantia_activate`, `garantia_cancel`,
  `garantia_mark_payment_status` e `garantia_my_context`;
- schemas Zod em `packages/validation/src/garantia.ts`;
- cliente com resultado `{ ok, data/message }` em `garantia-client.ts`;
- `/app/garantia` usa `SessionStatusGate` e `SoftListSlot`, com criação,
  activação, cancelamento, badges e timeline;
- o shell e o Finance Hub ligam à Garantia;
- a flag `garantia` pode interromper novas subscrições.

## Consequences

- Garantia torna-se um produto opcional auditável na stack financeira comum.
- O período de graça é deliberadamente curto e não exige cálculo pró-rata.
- Renovação automática e cobrança recorrente real ficam fora do N5; cada ciclo
  futuro deverá continuar a criar um intent no mesmo motor Kuteka Pay.
