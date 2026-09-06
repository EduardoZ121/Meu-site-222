# GOV — Requisitos para ciclo de estados / responsável / resolução (Beta feedback)

**Estado:** isolado — **não implementar** sem decisão Founder.  
**Objectivo:** mapear o que os documentos e a arquitectura **já exigem ou já oferecem**, sem inventar um segundo sistema de tickets.

Fonte documental: Doc 3 tabela BETA (`docs/master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md`).  
Fonte schema: `supabase/migrations/0035_kocc_beta_panel.sql` (+ métricas em `0042_beta_sandbox_visibility_guards.sql`).  
Padrões adjacentes existentes (referência de reutilização, **não** adopção automática): `operational_escalations` (`0040_ops_matrix_experiences.sql`), `platform_feature_flag_audit` (`0032_kocc_operating_control.sql`).

---

## 1. O que o Doc 3 pede (requisitos declarados)

| ID      | Requisito                                   | Prioridade Doc3 | Estado actual no código/schema                               |
| ------- | ------------------------------------------- | --------------- | ------------------------------------------------------------ |
| BETA-13 | Feedback não escondido                      | P0              | ✅ `/app/ajuda` + CTAs Sprint A                              |
| BETA-14 | Widget contextual in-page                   | P0 / Spec C     | 🔴 fora do P0 A/B (OPEN) — não construir agora               |
| BETA-15 | Tipos: BUG/UX/Sugestão/Reclamação/Avaliação | P1              | 🟡 schema só `feedback` \| `bug`                             |
| BETA-16 | Contexto rico (device/version/…)            | P1              | 🟡 só `page_path`; `metadata` existe mas RPC não preenche    |
| BETA-19 | Dashboard triagem KOCC                      | P1              | 🟡 métricas + inbox read-only (P0 B)                         |
| BETA-21 | KAI não decide                              | P0              | ✅ N/A no canal actual                                       |
| BETA-22 | Ciclo estados NOVO→FECHADO                  | P1              | 🔴 **inexistente**                                           |
| BETA-23 | Ack + resolução ao user                     | P2              | 🔴 **inexistente**                                           |
| BETA-24 | Reclamação ≠ feedback produto               | P1              | 🟡 bridge textual Help → admin/contacto (sem 2.ª inbox)      |
| BETA-30 | Privacidade / isolamento                    | P1              | 🟡 RLS ops-only SELECT; user não lê o próprio SELECT directo |

**Conclusão documental:** estados, responsável, resolução e notificação ao autor são **P1/P2 no Doc 3**, não bloqueiam o fecho técnico do canal P0 (captura + inbox + métricas). BETA-40 (loop aprendizagem fechado) depende explicitamente de 14–23 — é critério de **ciclo produto**, não de publish A/B.

---

## 2. O que o schema `beta_feedback` já define

Colunas: `id`, `kind`, `body`, `page_path`, `actor_id`, `metadata`, `created_at`.

Permissões:

| Operação            | Regra actual                          |
| ------------------- | ------------------------------------- |
| INSERT              | próprio `actor_id` ou RPC definer     |
| SELECT              | `finance.manage` **ou** `admin.panel` |
| UPDATE / DELETE     | **revogados** a `authenticated`       |
| `kocc_beta_metrics` | só `finance.manage`                   |

**Implicação técnica:** qualquer “estado / assignee / resolved_at” **exige** alteração de superfície (colunas e/ou RPC security definer + política). Não é bugfix.

---

## 3. Padrões já existentes que _poderiam_ ser reutilizados (se GOV autorizar)

Não são propostas activas — só inventário de compatibilidade arquitectónica:

1. **`operational_escalations` (0040)** — já tem `status` (`open|acknowledged|resolved|cancelled`), `assignee_id`, `resolved_by`, `resolved_at`, `resolution_notes`, RLS select, mutação via RPC (INSERT/UPDATE direct revogados a `authenticated`). É o paralelo mais próximo de “fila ops com dono e fecho”.
2. **`platform_feature_flag_audit` (0032)** — trilha before/after para flags KOCC; **não** cobre `beta_feedback`.
3. **`user_has_founder_or_permission`** — padrão pós-0036 usado noutros módulos; gap Founder em feedback está isolado na proposta **0043** (não aplicada).

**Regra:** reutilizar um destes padrões **só após** decisão; não copiar escalations para feedback “por ocupação”.

---

## 4. Requisitos mínimos _se_ Founder autorizar ciclo de estados (checklist de decisão)

Para cumprir BETA-22/23 sem segundo produto, a decisão tem de fechar:

1. **Âmbito:** estados só internos (ops) vs visíveis ao autor (BETA-23)?
2. **Modelo:** estender `beta_feedback` vs encaminhar reclamações graves para `operational_escalations` (BETA-24) e manter feedback produto read-only?
3. **Máquina de estados:** aceitar o set de escalations (`open→acknowledged→resolved|cancelled`) ou outro conjunto Doc3 “NOVO→…→FECHADO”?
4. **Responsável:** campo `assignee_id`? quem pode atribuir (`finance.manage`, `admin.panel`, Founder)?
5. **Mutação:** RPC security definer (padrão 0040) vs policy UPDATE directa?
6. **Auditoria:** tabela dedicada vs reutilizar `audit_logs` / padrão flag audit?
7. **Notificação ao user (BETA-23):** canal mensagens existente vs email vs só badge in-app — e retenção/privacidade (BETA-29/30)?
8. **Tipos (BETA-15):** expandir `kind` check constraint ou mapear UX→`feedback`, Reclamação→escalation?

Sem respostas a 1–2 (e preferencialmente 3–5), **não há implementação segura**.

---

## 5. Decisões pendentes (para o Founder) — isoladas

| ID        | Pergunta                                                                                             | Bloqueia A/B P0?                                |
| --------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| GOV-BF-01 | Autorizar **0043** (Founder read métricas/inbox)?                                                    | Não (ops com permissões actuais bastam)         |
| GOV-BF-02 | Autorizar ciclo de estados em `beta_feedback` **ou** rotear resolução via `operational_escalations`? | Não para P0                                     |
| GOV-BF-03 | BETA-15: manter 2 kinds ou expandir para 5 tipos?                                                    | Não para P0                                     |
| GOV-BF-04 | BETA-23: obrigatório ainda em Beta público controlado?                                               | Não (P2 Doc3)                                   |
| GOV-BF-05 | Aplicar **0044** (truncate `page_path` no servidor)?                                                 | Não — hardening opcional, sem GOV de autoridade |

---

## 6. Posição técnica recomendada (sem executar)

- **Fechar A+B** com captura + inbox + métricas + bridge reclamação (já preparado).
- **Não** inventar workflow de tickets enquanto GOV-BF-02 estiver aberto.
- Preferir, _quando_ houver decisão: **reutilizar** RPC+revoke UPDATE (padrão 0040) em vez de policy UPDATE aberta; e **separar** reclamação operacional (BETA-24) do canal produto.

0043 e 0044 permanecem **propostas não aplicadas**.
