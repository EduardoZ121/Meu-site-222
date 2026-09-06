# Status autónomo — write Site_Angola ainda bloqueado

Actualizado: 2026-09-06T18:56Z (re-probe timer)

## Re-probe
- `permissions.push=false`
- `git push` → Invalid username or token
- Tokens SITE_ANGOLA_* / GH_TOKEN unset no ambiente do agente
- `gh` autenticado como `cursor` sem grant no Site_Angola

## Tip local pronto
`/tmp/site-angola-publish` @ `1f5433a7` (branch `cursor/sprint-a-beta-experience-f96b`)
Vitest 141 · tsc OK · AB src patch apply-check OK

## Publish
`PUBLISH-WHEN-WRITE-OPENS.sh` — aplica `kuteka-sprint-ab-combined-src.patch`, push branch, tenta PR.

## Isolado
GOV-BF-01…05 · 0043 · 0044 · tickets · Vicente · Meu-site-222 ≠ SoT
