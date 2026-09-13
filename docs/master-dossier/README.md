# Kuteka — Master Dossier

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1 |
| **Data** | 2026-08-28 |
| **Fase** | FASE 0 — documentação e normalização (C1–C10) |
| **Autorização** | `AUTORIZO: FASE 0 — documentação [C1–C10]` |
| **Repositório** | `EduardoZ121/Site_Angola` |

## Propósito

Este dossiê consolida a base documental governada da Kuteka: requisitos KUT-XXX, Doc 3, normalização financeira, governação, compliance, identidade institucional dos fundadores, Beta Charter e Growth Architecture (papel).

**Nenhum documento deste dossiê autoriza alterações de código, migrations, deploy ou RBAC/RLS por si só.** Implementação requer autorização explícita por fase.

## Índice principal

Ver **[KUTEKA_MASTER_DOSSIER_INDEX_2026-08-28.md](./KUTEKA_MASTER_DOSSIER_INDEX_2026-08-28.md)** — inventário completo de artefactos, versões e dependências.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| [`finance/`](./finance/) | C1 normalização FIN, C2 dual path, pack KUT-FIN |
| [`legal/`](./legal/) | Pack KUT-LEG (rascunhos para revisão advogado) |
| [`governance/`](./governance/) | Protocolo FASE 0, KUT-GOV, Governed Development |
| [`compliance/`](./compliance/) | KUT-POL, KUT-CMP, BCP, DRP, INC |
| [`beta/`](./beta/) | Beta Charter v2, scorecard, QA playbook |
| [`growth/`](./growth/) | Growth Architecture (papel) |
| [`templates/`](./templates/) | Atas, incidentes, decision register |
| [`consolidation/`](./consolidation/) | Master Table KUT-XXX, Doc 3, manifesto Fase 0 |

## Documentos relacionados (fora do dossiê)

- [`../product/KUTEKA_GOVERNED_INTERPRETATION_REPORT_2026-08-28.md`](../product/KUTEKA_GOVERNED_INTERPRETATION_REPORT_2026-08-28.md)
- [`../finance/ARQUITETURA_FINANCEIRA_KUTEKA.md`](../finance/ARQUITETURA_FINANCEIRA_KUTEKA.md)
- [`../legal/`](../legal/) — instrumentos v1 publicados
- [`../operations/BUSINESS_CONTINUITY_PLAN_v0.9.md`](../operations/BUSINESS_CONTINUITY_PLAN_v0.9.md)
- [`../operations/DISASTER_RECOVERY_PLAN_v0.9.md`](../operations/DISASTER_RECOVERY_PLAN_v0.9.md)

## Fluxo de validação

1. Founder revê rascunhos marcados `DRAFT — aguarda advogado/contabilista`
2. Correcções: `CORRECÇÃO DO FOUNDER — ITEM KUT-XXX`
3. Implementação: `AUTORIZO: FASE X — [escopo]`
