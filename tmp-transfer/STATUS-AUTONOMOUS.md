# Status autónomo — write Site_Angola bloqueado

Actualizado: 2026-09-07T04:03Z (re-probe timer)

## Re-probe
- permissions.push=false · viewerPermission=null
- git push: Invalid username or token
- sem SITE_ANGOLA_* / GH_TOKEN

## Tip local pronto
`/tmp/site-angola-publish` @ `c5da1e6d`
Baseline `main`: `ce203d4f` (inalterado)

Validação nesta corrida: Vitest **149/149** · unified-src `apply --check` OK

## Publish kit (pronto)
- `kuteka-sprint-ab-unified.patch` (+ prebuilt)
- `kuteka-sprint-ab-unified-src.patch`
- `PUBLISH-WHEN-WRITE-OPENS.sh` (unified apply + fallback rebuild)

## Isolado — NÃO aplicar
GOV-BF · 0043 · 0044 · 0045 proposta · tickets · Vicente

## Desbloqueio (Founder)
Instalar Cursor GitHub App em `EduardoZ121/Site_Angola` **ou** fornecer `SITE_ANGOLA_PUSH_TOKEN` com `repo` scope. Agente publica A→B automaticamente sem nova ordem.
