# C1 — Normalização documental KUT-FIN (conflitos resolvidos)

| Campo | Valor |
|-------|-------|
| **ID** | C1 |
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Estado** | Aprovado pelo Founder (base de trabalho) |
| **Tipo** | Normalização documental — **sem alteração de código** |

## Decisão Founder (2026-08-28)

Adoptada provisoriamente a seguinte atribuição canónica de IDs financeiros:

| ID | Título canonical | Fonte prevalecente | Notas |
|----|------------------|-------------------|-------|
| **KUT-FIN-001** | Modelo Financeiro e Contabilístico / Financial Governance Policy | Doc 1 + Doc 2 (mesmo intent) | Documento-mestre |
| **KUT-FIN-002** | **Financial Flow Map** | Doc 2 | Mapa de fluxos dinheiro |
| **KUT-FIN-003** | **Payment & Financial RACI** | Doc 2 | Matriz R/A/C/I financeira |
| **KUT-FIN-004** | **Financial Classification Map** | Doc 2 | Plano de contas / classificação |
| **KUT-FIN-005** | Commission Management Policy | Doc 1 + Doc 2 | Ver [C2](./C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md) |
| **KUT-FIN-006** | Payment & Collection Policy | Doc 1 | Nascimento/pagamento/falha/reembolso |
| **KUT-FIN-007** | **Reconciliation Procedure** | Doc 1 | Procedimento passo-a-passo |
| **KUT-FIN-008** | Monthly Accounting & Tax Report Specification | Doc 2 | Pacote mensal contabilista |
| **KUT-FIN-009** | **Refund Policy** *(novo)* | Doc 1 (ex-FIN-004) | Procedimento financeiro de reembolso |
| **KUT-FIN-010** | **Payment Responsibility Matrix** *(novo)* | Doc 1 (ex-FIN-002) | Responsabilidades de pagamento |

## IDs órfãos resolvidos

| ID anterior (Doc 1) | Conteúdo Doc 1 | Novo ID |
|---------------------|----------------|---------|
| KUT-FIN-002 | Payment Responsibility Matrix | **KUT-FIN-010** |
| KUT-FIN-003 | Reconciliation Procedure | **KUT-FIN-007** (já existia) |
| KUT-FIN-004 | Refund Policy | **KUT-FIN-009** |

## Relação com outros domínios (não duplicar)

| Tema | KUT financeiro | KUT legal | KUT política |
|------|----------------|-----------|--------------|
| Reembolso | FIN-009 (procedimento ops) | LEG-043 (contrato/cancelamento) | POL-006 (regra empresarial) |
| Pagamentos | FIN-006, FIN-010 | LEG-003 (Pay regulatório) | POL-004 |
| Comissões | FIN-005 | — | POL-005 |
| Reconciliação | FIN-007 | — | — |

## Implementação

- **Fase 0:** apenas documentação e referências cruzadas
- **Fases futuras:** migrations/RPC/UI **somente** após `AUTORIZO: FASE X` e decisão D1 (fonte comissão)

## Referências

- [KUT-FIN Pack v0.1](./KUT-FIN_PACK_DRAFTS_v0.1.md)
- [Master Table](../consolidation/KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md)
