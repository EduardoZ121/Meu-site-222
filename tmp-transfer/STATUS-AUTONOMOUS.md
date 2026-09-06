# Kuteka — estado autónomo (Git write bloqueado em Site_Angola)

Actualizado: 2026-09-06. Fonte oficial: **EduardoZ121/Site_Angola** apenas.  
Meu-site-222 = ponte temporária de artefactos (`tmp-transfer/`). Não é fonte de verdade.

## Baseline oficial
- `main` HEAD auditado: `ce203d4` (stabilize #71)

## Commits locais prontos (`/tmp/site-angola-publish`, branch `cursor/sprint-a-beta-experience-f96b`)
| Commit     | Conteúdo |
|------------|----------|
| `bf98a700` | Sprint A P0 — beta messaging, inventory clarity, security headers + prebuilt |
| `8faa18b6` | Sprint B P0 — KOCC inbox + complaint bridge + labels/tests |
| `400b473e` | Sprint B harden — inbox independente de métricas + audit RLS + proposta 0043 |

## Validação local (última corrida)
- Vitest: **131/131**
- `tsc --noEmit`: OK
- Patches: `git apply --check` sobre `ce203d4` (combinado AB)

## Bloqueio
- Cloud Agent GitHub App: write só em Meu-site-222 → **403** em Site_Angola
- **Não** feito neste período: push/PR/merge Site_Angola; alteração de permissões; fork Vicente; declarar A/B em produção

## Artefactos nesta pasta
| Ficheiro | Uso |
|----------|-----|
| `kuteka-sprint-a-p0.patch` | Sprint A completa (com prebuilt se incluído) |
| `kuteka-sprint-a-p0-src.patch` | Sprint A sem `prebuilt/` |
| `kuteka-sprint-b-p0.patch` | Sprint B P0 + harden (em cima de A: `bf98a700..400b473e`) |
| `kuteka-sprint-b-p0-harden.patch` | Só o harden (`8faa18b6..400b473e`) se B base já aplicado |
| `kuteka-sprint-ab-combined.patch` | A+B num único patch desde `ce203d4` |
| `PUBLISH-SPRINT-A-P0.sh` | One-shot publish (requer credenciais write) |
| `APPLY-*.txt` | Instruções manuais |
| `REGRESSION-LOCAL.md` | Smoke/regressão pós-publish |
| `BLOCKED-PERIOD-REPORT.md` | Relatório A–E deste período |

## Próximo passo após write
1. Publicar Sprint A → PR `main` → smoke produção  
2. Publicar Sprint B → smoke ajuda → KOCC inbox  
3. Decisão Founder sobre proposta RLS `0043` (não aplicar sem aprovação)
