# Sprint B — ciclo completo (auditoria aprofundada)

**Estado código local:** `400b473e` + harden submit/inbox filter (este ciclo).  
**Fonte:** `EduardoZ121/Site_Angola` · migrations `0035`, `0042`.

## Mapa do ciclo pedido vs. o que existe

| Etapa            | Pedido conceptual    | Estrutura existente                                              | Estado                                             |
| ---------------- | -------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| 1. Feedback      | Utilizador submete   | `BetaFeedbackForm` → `kocc_submit_beta_feedback`                 | ✅                                                 |
| 2. Contexto      | página / origem      | `page_path`; coluna `metadata` existe mas RPC **não a preenche** | 🟡 path só; metadata ociosa                        |
| 3. Inbox         | lista ops            | `listRecentBetaFeedback` + `BetaPanelSection`                    | ✅ (bug SoftListSlot corrigido; filtro kind local) |
| 4. KOCC          | painel               | `kocc_beta_metrics` + secção Beta no KOCC/Founder                | ✅ (métricas ≠ inbox)                              |
| 5. Classificação | bug vs sugestão      | `kind` check (`feedback`\|`bug`) + filtro UI                     | ✅ suficiente P0                                   |
| 6. Triagem       | atribuir / priorizar | **sem colunas**; UPDATE revogado                                 | 🔴 GOV — não inventar tickets                      |
| 7. Estado        | NOVO→…→FECHADO       | **não existe**                                                   | 🔴 GOV                                             |
| 8. Auditoria     | quem mudou o quê     | `kocc_flag_audit` é de **flags**, não de feedback                | 🔴 GOV se quiserem audit de feedback               |
| 9. Resolução     | fechar com nota      | **não existe**                                                   | 🔴 GOV                                             |

## RLS (resumo)

- INSERT own / RPC definer com `actor_id = auth.uid()`
- SELECT: `finance.manage` **ou** `admin.panel`
- UPDATE/DELETE: revogados a `authenticated`
- `kocc_beta_metrics`: só `finance.manage`
- Gap Founder vs permissions: **isolado** — proposta `0043` **não aplicada**

## Decisões isoladas (não executar sem Founder)

1. **0043** — Founder read em métricas/inbox via `user_has_founder_or_permission`
2. **Workflow de estados** em `beta_feedback` (colunas + UPDATE policy + audit) — seria extensão de produto/governação, não bugfix
3. **Preencher `metadata`** com UA/locale — útil, mas política de retenção/privacidade; proposta path-guard `0044` é só truncate de `page_path`

## Hardening técnico feito / a embalar no patch

- Inbox independente de métricas
- Empty-state não mascara erro de SELECT
- Filtro local Todos/Bugs/Sugestões (reutiliza `kind`)
- Sanitize `page_path` + validação body/kind no cliente
- Telemetria help + bug vs suggestion
- Proposta `0044` path guard servidor (comentada)

## Duplicações evitadas

- Uma só Inbox (KOCC), um só form (`BetaFeedbackForm`), um só submit RPC
- Reclamação operacional = bridge textual para admin/contacto — **não** segundo inbox
- Feature-tracking alargado / Product Insights → **não** expandido neste período (lista deps apenas)
