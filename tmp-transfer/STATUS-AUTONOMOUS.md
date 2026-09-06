# Status autónomo — write Site_Angola ainda bloqueado

Actualizado: 2026-09-06 (pós-harden B)

## Oficial
- Repo: `EduardoZ121/Site_Angola`
- Baseline main auditado: `ce203d4`
- Write probe: permissions push=false; `git push` → auth fail / sem token válido

## Commits locais prontos (`/tmp/site-angola-publish`)
| Hash | Conteúdo |
|------|----------|
| `bf98a700` | Sprint A P0 |
| `8faa18b6` | Sprint B P0 inbox + complaint bridge |
| `400b473e` | Inbox independente de metrics + audit RLS |
| `59d0516b` | Harden submit/path + filtro kind + empty≠error + prebuilt + docs ciclo |

## Validação local (59d0516b)
- Vitest: **137/137**
- `tsc --noEmit`: OK
- Static export: **OK** via `scripts/build-static-web.sh` (stash middleware/api)
- `git apply --check` combined-src sobre `ce203d4`: OK

## Isolado (GOV — não executar)
- Proposta `0043` Founder read
- Workflow estados/UPDATE/UPDATE em `beta_feedback` (UPDATE UPDATE)
- Product Insights / Sprint C feature productization

## Ponte Meu-site-222
Pasta `tmp-transfer/` — patches A/B/combined + smoke + docs. Não é SoT Kuteka.

## Quando write abrir (auto)
1. Push branch Sprint A → PR → CI → merge conforme política → deploy → smoke A
2. Push/PR Sprint B (incl. harden) → merge → deploy → smoke inbox/KOCC
3. Continuar itens técnicos restantes autorizados
