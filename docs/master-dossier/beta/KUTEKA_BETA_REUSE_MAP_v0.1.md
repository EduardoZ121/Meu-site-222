# Kuteka Beta — Mapa de reutilização (BETA-36)

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1 |
| **Data** | 2026-08-28 |

## Módulos existentes a reutilizar (não duplicar)

| Módulo | Evidência | Uso Beta |
|--------|-----------|----------|
| **KIS/KYC** | `0018`, PRD-009 | Gates por risco |
| **KAI** | Rules RPC, insights | Onboarding, agrupamento feedback |
| **KOCC** | `0032`, `0035` | Module status, Beta panel, flags |
| **Trust** | `0034`, reviews | Reclamações, avaliações |
| **Marketplace** | `0023` | Prestadores |
| **Ledger/Pay** | `0019–0023` | Sandbox only Beta |
| **Chat** | `0033` | Comunicação |
| **Publication queue** | `0036`, `0037`, `0039` | Inventário→Mercado |
| **Feature Management** | KOCC modules | Beta labels, Growth flags futuro |
| **Audit** | `0037` Audit Center | Feedback, identidade |
| **beta_feedback** | `0035` | Base feedback (extender tipos) |
| **availability_notify** | `0017` | Procura sem oferta |
| **founders** | `0036` | Identidade institucional |
| **Escalations** | `0040` | Reclamações operacionais |
| **FlowNextSteps** | UI shell | Progressive onboarding |

## Lacunas (criar — não duplicar)

| Lacuna | Reutiliza base | Novo |
|--------|----------------|------|
| Feedback contextual | beta_feedback | Widget + tipos |
| Funil Beta | KOCC metrics | Dashboard read-only |
| Learning panel | KOCC + KAI | Agregações |
| Registo rápido UX | properties lifecycle | Form mínimo |

## Proibido

- Segundo sistema feedback paralelo
- Segundo RBAC para intenção onboarding
- CRM Growth completo na Beta (LEAD = E)
