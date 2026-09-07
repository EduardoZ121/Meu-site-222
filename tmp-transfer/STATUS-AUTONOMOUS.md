# Status autónomo — write Site_Angola bloqueado

Actualizado: 2026-09-07T01:01Z (re-probe timer)

## Re-probe
- permissions.push=false · viewerPermission=null
- git push: Invalid username or token
- gh create-ref: 403 Resource not accessible by integration
- SITE_ANGOLA_* / GH_TOKEN unset

## Tip local pronto a publicar
`/tmp/site-angola-publish` @ `c5da1e6d` (branch `cursor/sprint-a-beta-experience-f96b`)
Baseline oficial `main`: `ce203d4f`

Validação: Vitest 149 · tsc OK · patches apply-check OK

## Kit (`tmp-transfer/` em Meu-site-222 — bridge only)
| Artefacto | Uso |
|-----------|-----|
| `kuteka-sprint-ab-combined.patch` | A+B+prebuilt até `1eb3ffe3` |
| `kuteka-sprint-b-actor-hint.patch` | delta tip `c5da1e6d` |
| `kuteka-sprint-ab-combined-src.patch` | A+B src até tip (review) |
| `PUBLISH-WHEN-WRITE-OPENS.sh` | apply combined + actor → push/PR |

## Isolado — NÃO aplicar
GOV-BF-01…05 · 0043 · 0044 · 0045 (proposta) · workflow tickets · Vicente

## Quando write abrir (auto)
`PUBLISH-WHEN-WRITE-OPENS.sh` → PR → smoke A → smoke B Inbox/KOCC
