# Status autónomo — write Site_Angola bloqueado

Actualizado: 2026-09-06T23:00Z (re-probe timer)

## Re-probe
- permissions.push=false
- git push auth fail
- gh create-ref 403
- sem SITE_ANGOLA_PUSH_TOKEN

## Tip local pronto
`/tmp/site-angola-publish` @ `c5da1e6d`
Vitest 149 · tsc OK · src patch apply-check OK

### Publish kit
- `kuteka-sprint-ab-combined.patch` — até prebuilt `1eb3ffe3`
- `kuteka-sprint-b-actor-hint.patch` — delta tip `c5da1e6d` (aplicar após combined)
- `kuteka-sprint-ab-combined-src.patch` — A+B completo sem prebuilt até tip
- `PUBLISH-WHEN-WRITE-OPENS.sh` aplica combined + actor delta

## Isolado (não aplicar)
GOV-BF · 0043 · 0044 · 0045 proposal · tickets · Vicente

## Quando write abrir
Executar script / push tip → PR → smoke A → smoke B Inbox/KOCC
