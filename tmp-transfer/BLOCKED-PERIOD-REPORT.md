# Relatório — trabalho útil com Git write bloqueado (Site_Angola)

Data: 2026-09-06  
Restrições respeitadas: sem push/merge/permissões em Site_Angola; sem Vicente; Meu-site-222 só como ponte `tmp-transfer/`.

---

## A. Trabalho que pode ser executado agora (sem write oficial)

1. Auditoria aprofundada do ciclo já existente Inbox → RPC → `beta_feedback` → KOCC + RLS
2. Harden local Sprint B (bugs descobertos na auditoria)
3. Testes unitários / typecheck / `git apply --check` de patches
4. Documentação técnica de auditoria + checklist de regressão
5. Proposta SQL RLS Founder (só proposta; sem apply)
6. Empacotar patches + scripts de apply para publicação posterior
7. Inventário do que falta para fechar Sprint B P0 em produção (deps)
8. Continuar análise de inconsistências/duplicações no código local clone

**Não** útil neste período: novas arquitecturas; rebuild de KOCC/inbox; declarar A/B “em produção”; Sprint C sem A validado.

---

## B. Trabalho que já executaste neste período

| Item | Resultado |
|------|-----------|
| Auditoria loop + RLS | Doc `SPRINT_B_FEEDBACK_LOOP_AUDIT.md` |
| Bug SoftListSlot (inbox depende de métricas) | Corrigido em `BetaPanelSection.tsx` |
| Telemetria help + bug vs suggestion | `HelpCenterClient` + `BetaFeedbackForm` |
| Proposta RLS Founder | `proposals/0043_…sql` (não aplicada) |
| Vitest + tsc | **131/131**, tsc OK |
| Commit local | `400b473e` em cima de `8faa18b6` / `bf98a700` |
| Verify patches | `git apply --check` AB sobre `ce203d4` OK |
| Bridge Meu-site-222 | patches + STATUS + REGRESSION actualizados |

Sprint A P0 e Sprint B P0 base já estavam feitos antes; **não** refeitos.

---

## C. Trabalho preparado para publicação

Árvore local: `/tmp/site-angola-publish` @ `400b473e`  
Branch pretendida: `cursor/sprint-a-beta-experience-f96b` (ou split A/B se preferirem PRs separados)

Patches em `Meu-site-222` `tmp-transfer/`:
- `kuteka-sprint-a-p0.patch` / `-src.patch`
- `kuteka-sprint-b-p0.patch` (B+harden desde A)
- `kuteka-sprint-b-p0-harden.patch` (só harden)
- `kuteka-sprint-ab-combined.patch`
- `PUBLISH-SPRINT-A-P0.sh` + APPLY/STATUS/REGRESSION

Ordem recomendada de PR: **A primeiro** → smoke prod → **B** → smoke inbox.

---

## D. O que depende exclusivamente do acesso Git (Site_Angola write)

1. Push branch(es) + abrir PR(s) no repo oficial
2. Merge para `main` (se política exigir humano: só o Founder)
3. Deploy / Render a partir do oficial
4. Smoke em produção autenticado contra Supabase real
5. Aplicar migration proposta `0043` **se** Founder aprovar (também precisa write no repo + apply no Supabase)
6. Qualquer alteração de App install / secrets / permissões GitHub (Founder — não agente)

---

## E. Próxima acção autónoma recomendada

**Enquanto o write continuar bloqueado:** parar de empilhar produto novo; manter patches sincronizados; opcionalmente aprofundar inventário de feature-tracking P0 restante (3–5 fluxos) **só como lista**, sem implementar Sprint C.

**No momento em que o write abrir:** publicar **Sprint A** imediatamente (maior valor + desbloqueia validação real), depois B.

Unblock Founder: instalar Cursor GitHub App em `EduardoZ121/Site_Angola`, ou `SITE_ANGOLA_PUSH_TOKEN`, ou correr `PUBLISH-SPRINT-A-P0.sh` com credenciais humanas.
