# KUT-POL / CMP / BCP / DRP / INC — Compliance Pack v0.1

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-28 |
| **Estado** | Rascunho Fase 0 |

---

## KUT-POL-001 — Política de Segurança da Informação

**Nível:** Regra empresarial (PRO desce implementação)

- Acessos mínimos, MFA para admin, logs, incidentes
- Referência: ADR-026, Security Center
- **Estado:** 🔴 formal KUT-POL

---

## KUT-POL-002 — Política de Protecção de Dados

**Base:** [`POLITICA_PRIVACIDADE_v1.md`](../../legal/POLITICA_PRIVACIDADE_v1.md) → promover a POL-002 formal
- Bases legais, retenção, direitos titular, DPO contacto

---

## KUT-POL-003 — Política Financeira

Princípios: segregação, aprovações, sandbox vs real, SoD comissão

---

## KUT-POL-004 — Política de Pagamentos

Quando nasce/paga/falha/reembolsa; gates KYC por risco

---

## KUT-POL-005 — Política de Comissões

- Activacao 35% Founder-only
- Ver [C2](../finance/C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md)
- Sem retroactividade

---

## KUT-POL-006 — Política de Reembolsos

Distinto FIN-009 (procedimento) e LEG-043 (contrato)

---

## KUT-POL-007 — Política Gestão Prestadores

Onboarding, moderação, comissão, publicidade

---

## KUT-POL-008 — Política Gestão Agentes

Conduta, leads, conflitos, visitas — alinhar LEG-040

---

## KUT-POL-009 — Política Conflitos de Interesse

Declaração, sanções — agente/prestador/PP

---

## KUT-POL-010 — Política Continuidade do Negócio

**Base:** promover [`BCP v0.9`](../../operations/BUSINESS_CONTINUITY_PLAN_v0.9.md) + [`DRP v0.9`](../../operations/DISASTER_RECOVERY_PLAN_v0.9.md)

---

## KUT-CMP-001 — Compliance Framework

1. Inventário políticas POL/LEG/FIN
2. Responsáveis por domínio
3. Calendário revisão
4. Registo pareceres ADVICE
5. Roadmap compliance Founder Center (futuro)

---

## KUT-CMP-002 — Tax Compliance Procedure

- Calendário fiscal Angola (manual)
- Export SAF-T comentado — **sem scraping AGT**
- Evidências por período

---

## KUT-CMP-003 — Payment Compliance Framework

Bloqueado até LEG-003 + ADVICE-001. Classificação **D**.

---

## KUT-BCP-001 — Business Continuity Plan

**Acção Fase 0:** Promover [`BUSINESS_CONTINUITY_PLAN_v0.9.md`](../../operations/BUSINESS_CONTINUITY_PLAN_v0.9.md) → KUT-BCP-001 v1.0-KUT (renomear header, manter conteúdo)

---

## KUT-DRP-001 — Disaster Recovery Plan

**Acção Fase 0:** Promover [`DISASTER_RECOVERY_PLAN_v0.9.md`](../../operations/DISASTER_RECOVERY_PLAN_v0.9.md) → KUT-DRP-001 v1.0-KUT

---

## KUT-INC-001 — Incident Management Procedure

1. Classificação (P1–P4)
2. Resposta e comunicação
3. Pós-mortem
4. Template: [KUT-INC-2026-001](../templates/KUT-INC-2026-001_TEMPLATE.md)

---

## KUT-DOC-001 — Document Management Policy

- Versionamento sem apagar histórico
- Estados: Rascunho → Revisão → Validado → Publicado → Arquivado
- Legal Pack no Master Dossier

---

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1-DRAFT | 2026-08-28 | Fase 0 compliance pack |
