# Status autónomo — write Site_Angola bloqueado

Actualizado: 2026-09-07T08:04Z (re-probe timer)

## Re-probe
- permissions.push=false
- `cursor[bot]`: **Permission denied** on `EduardoZ121/Site_Angola` (403)
- sem SITE_ANGOLA_PUSH_TOKEN
- `main` oficial ainda em `ce203d4f` (sem commits novos no remoto)

## Tip local pronto
`/tmp/site-angola-publish` @ `c5da1e6d`
Kit: `kuteka-sprint-ab-unified{,-src}.patch` + `PUBLISH-WHEN-WRITE-OPENS.sh`

## Isolado
GOV-BF · 0043 · 0044 · 0045 proposta · tickets · Vicente

## Desbloqueio Founder
Instalar/autorizar Cursor GitHub App no repo **ou** secret `SITE_ANGOLA_PUSH_TOKEN`.
Após isso o agente publica A→PR→smoke→B automaticamente.
