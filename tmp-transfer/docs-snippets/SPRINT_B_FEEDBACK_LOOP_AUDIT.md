# Sprint B — Auditoria do ciclo Inbox → beta_feedback → KOCC

**Âmbito:** leitura + correcções locais (sem publish). Fonte oficial continua `EduardoZ121/Site_Angola`.

## Fluxo actual (reutilizado)

```
Utilizador autenticado
  → /app/ajuda (BetaFeedbackForm)
  → RPC kocc_submit_beta_feedback (security definer)
  → INSERT public.beta_feedback (kind: feedback|bug, body, page_path, actor_id)
  → kocc_track_feature('beta.feedback', …)  [servidor]
  → Painel KOCC (Super/Founder tab kocc)
       ├─ kocc_beta_metrics() → contadores feedbackReceived / bugsReported
       └─ SELECT beta_feedback (listRecentBetaFeedback) → Inbox de triagem
```

## RLS / permissões

| Operação            | Regra                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| INSERT directo      | `actor_id = auth.uid()`                                                      |
| INSERT via RPC      | security definer; actor forçado a `auth.uid()`                               |
| SELECT              | `finance.manage` **ou** `admin.panel`                                        |
| UPDATE/DELETE       | revogados a `authenticated`                                                  |
| `kocc_beta_metrics` | exige **apenas** `finance.manage` (não usa `user_has_founder_or_permission`) |

### Privacidade

- Utilizador A **não** lê feedback de B (nem o próprio via SELECT directo).
- Ops com `finance.manage` / `admin.panel` lêem todos os corpos (triagem).

### Gap registado (exige decisão Founder — RBAC)

Founder “puro” (`is_founder` sem `finance.manage`/`admin.panel`) pode abrir Founder Center (`canManage` inclui `isFounder`) mas:

- métricas falham (`finance.manage required`);
- inbox SELECT falha se também não tiver `admin.panel`.

**Proposta técnica (não aplicada):** alinhar policy SELECT + `kocc_beta_metrics` a `user_has_founder_or_permission(..., 'finance.manage')` — padrão já usado noutros módulos pós-0036. **Pendente validação Founder** (alteração de superfície de permissões).

## Bugs / inconsistências corrigidos localmente

1. Inbox estava **dentro** do ramo `metrics ? …` + SoftListSlot de métricas → se métricas falhassem, a inbox nunca aparecia. **Corrigido:** inbox irmã independente.
2. Telemetria de submit não distinguia bug vs sugestão no cliente (RPC só conta `beta.feedback`). **Corrigido:** `trackBetaFeature('beta.feedback.bug'|'.suggestion')` após sucesso.
3. Centro de ajuda sem evento de utilização. **Corrigido:** `help.center` no mount.

## O que NÃO foi recriado

- Tabelas/RPCs de feedback
- Sistema paralelo de tickets
- Widget contextual in-page (P2 / OPEN-06)
- Screenshots (P2)
- Workflow de estados NOVO→FECHADO (P1+)

## Dependências para fechar Sprint B P0 em produção

1. Publish Sprint A + B patches → `main`
2. Confirmar migrations 0035 (+0042) no Supabase remoto
3. Smoke: submit em `/app/ajuda` → contadores KOCC → linha na inbox
4. Decisão Founder sobre gap RLS Founder vs `finance.manage`
