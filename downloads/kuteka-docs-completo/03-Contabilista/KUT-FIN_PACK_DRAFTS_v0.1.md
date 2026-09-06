# KUT-FIN Pack — Rascunhos v0.1

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-28 |
| **Estado** | Rascunho — aguarda contabilista + Founder |
| **IDs** | KUT-FIN-001 a KUT-FIN-010 |

> **Aviso:** Rascunhos operacionais. Não substituem parecer contabilístico ou fiscal. Validar antes de Pay real.

---

## KUT-FIN-001 — Modelo Financeiro e Contabilístico

**Objectivo:** Documento-mestre que explica actividade Kuteka, fontes de receita, comissões, despesas e tratamento contabilístico.

**Base existente:** [`docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md`](../../finance/ARQUITETURA_FINANCEIRA_KUTEKA.md) v1.0

**Conteúdo mínimo a formalizar:**

1. Actividade económica Kuteka (intermediação vs serviços)
2. Mapa de receitas: activação, serviços, publicidade, subscrições
3. Tratamento contabilístico preliminar (conta, momento de reconhecimento)
4. Sandbox vs produção financeira
5. Referências cruzadas FIN-002–010, LEG-003, CMP-003

**Estado plataforma:** Ledger + Pay sandbox 🟢; documento KUT-FIN-001 formal 🔴

---

## KUT-FIN-002 — Financial Flow Map

**Objectivo:** Diagrama/mapas de quem paga, quem recebe, quando e com que documento.

**Fluxos a documentar:**

| Fluxo | Pagador | Receptor | Documento | Estado código |
|-------|---------|----------|-----------|---------------|
| Serviço marketplace | Cliente | Prestador + Kuteka comissão | Invoice | Sandbox 🟢 |
| Activacao arrendamento | Cliente | Kuteka comissão 35% + saldo PP | TBD | Param 🟡 |
| **Renda PP (cobrança + liquidação)** | Cliente | PP (saldo) + Kuteka (comissão) | [KUT-BIZ-RENT-001](./KUTEKA_RENT_SETTLEMENT_BUSINESS_MODEL_FASE0.md) | Requisito 🟡 — D-LEG/D-FIN |
| Kuteka Pay intent | Cliente | Gateway stub | Ledger entry | Sandbox 🟢 |
| Reembolso | Kuteka/PSP | Cliente | Credit note | RPC 🟢 |

**Entregável:** diagrama Mermaid + tabela (incluir em revisão contabilista).

---

## KUT-FIN-003 — Payment & Financial RACI

**Objectivo:** Matriz Processo × Papel (R/A/C/I) para operações financeiras críticas.

| Processo | Founder | Super | Admin | Contabilista* | Cliente |
|----------|---------|-------|-------|---------------|---------|
| Definir comissão activação 35% | **A/R** | I | — | C | — |
| Alterar regra comercial Super | I | **A/R** | — | C | — |
| Reconciliação mensal | I | **A** | C | **R** | — |
| Aprovar reembolso | I | **A/R** | C | I | I |
| Activar Pay real | **A** | C | — | C | — |

*Contabilista: role futuro — ver decisão D7.

---

## KUT-FIN-004 — Financial Classification Map

**Objectivo:** Plano de contas / mapa classificação contabilística Kuteka.

**Secções:**

- Receitas operacionais (comissões, serviços, publicidade)
- Passivos (obrigações reembolso, adiantamentos)
- Contas analíticas por produto
- Separar Kuteka Pay (dinheiro) vs Pontos Kuteka (não dinheiro — ver Growth paper)

**Estado:** 🔴 — requer contabilista

---

## KUT-FIN-005 — Commission Management Policy

Ver documento dedicado: [C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md](./C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md)

**Política escrita (resumo):**

- Activacao 35%: Founder/Owner only
- Versionamento de alterações
- Sem retroactividade
- Duas vias actuais documentadas; unificação pendente D1

---

## KUT-FIN-006 — Payment & Collection Policy

**Objectivo:** Regras de nascimento da obrigação, pagamento, falha, duplicado, chargeback, pendente.

**Estados Kuteka Pay (sandbox):** mapear estados RPC existentes → política.

| Estado | Significado | Acção permitida |
|--------|-------------|-----------------|
| draft | Intenção criada | Cancelar |
| awaiting_payment | Aguarda PSP | Retry/timeout |
| paid | Confirmado ledger | Reembolso condicionado |
| failed | Falha gateway | Notificar + retry |
| refunded | Reembolsado | Audit only |

---

## KUT-FIN-007 — Reconciliation Procedure

**Objectivo:** Procedimento passo-a-passo reconciliação.

**Passos:**

1. Exportar transacções Ledger (`finance_create_accounting_export` stub)
2. Importar extracto gateway/banco (manual Fase 0)
3. Comparar linha a linha; marcar excepções
4. Supervisor/Finance review excepções
5. Founder/Super aprovar fecho período
6. Registar auditoria + anexar evidências

**UI existente:** Super recon panel 🟡

---

## KUT-FIN-008 — Monthly Accounting & Tax Report Specification

**Objectivo:** Spec pacote mensal para contabilista (receitas, comissões, despesas, impostos).

**Campos mínimos export:**

- Período, moeda (AOA)
- Receitas por tipo
- Comissões Kuteka vs repasse
- Reembolsos e chargebacks
- Divergências abertas
- Notas AGT (apoio manual — **sem scraping**)

**Botão futuro:** "Gerar pacote contabilístico" (Founder/Super/contabilista)

---

## KUT-FIN-009 — Refund Policy *(novo ID)*

**Objectivo:** Procedimento financeiro operacional de reembolso.

**Distinção:**

- **FIN-009:** como processar reembolso no Ledger/Pay
- **LEG-043:** direitos contratuais cancelamento
- **POL-006:** regra empresarial prazos/responsável

**Passos operacionais:**

1. Pedido elegível (contrato/serviço)
2. Validação fraude/trust
3. Aprovação Super/Founder conforme valor
4. RPC refund + ledger entry
5. Notificação cliente + audit

---

## KUT-FIN-010 — Payment Responsibility Matrix *(novo ID)*

**Objectivo:** Quem é responsável financeiramente por cada tipo de pagamento.

| Tipo pagamento | Responsável primário | Backup | Escalation |
|----------------|---------------------|--------|------------|
| Taxa serviço Cliente | Cliente | — | Super |
| Comissão activação | Parceiro/Cliente* | Kuteka cobrança | Founder |
| Payout Prestador | Kuteka Pay | Super | Founder |
| Reembolso | Kuteka (PSP) | Super | Founder + contabilista |

*Conforme modelo comercial validado — ver FIN-001.

---

## Histórico de versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1-DRAFT | 2026-08-28 | Criação Fase 0; normalização FIN-009/010 |
