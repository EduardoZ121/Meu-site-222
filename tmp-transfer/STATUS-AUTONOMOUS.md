# Status autónomo — write Site_Angola ainda bloqueado

Actualizado: 2026-09-06 (pós GOV requirements + inbox filter extract)

## Oficial
- Repo SoT: `EduardoZ121/Site_Angola` (nunca Vicente)
- Baseline main: `ce203d4`
- Write probe: permissions push=false; git push auth fail; sem SITE_ANGOLA_PUSH_TOKEN

## Commits locais (`/tmp/site-angola-publish`, branch `cursor/sprint-a-beta-experience-f96b`)
| Hash | Conteúdo |
|------|----------|
| `bf98a700` | Sprint A P0 |
| `8faa18b6` | Sprint B P0 inbox + complaint bridge |
| `400b473e` | Inbox independente de metrics |
| `59d0516b` | Harden submit/path + filtro kind + empty≠error |
| `630ef805` | GOV requirements Doc3↔schema; extract inbox filter + tests |

## Validação
- Vitest: **139/139**
- tsc: OK
- Static export: OK (ciclo anterior; tip docs/filter only — rebuild prebuilt na publish)

## GOV isolado (não executar)
- 0043 Founder read
- 0044 path truncate server
- Workflow estados/assignee/resolução — ver `GOV_BETA_FEEDBACK_WORKFLOW_REQUIREMENTS.md` (GOV-BF-01…05)

## Quando write abrir (auto)
Sprint A → PR → smoke → Sprint B+harden → smoke Inbox/KOCC → reavaliar.
