# Status autónomo — write Site_Angola bloqueado

Actualizado: 2026-09-07T01:03Z

## Re-probe
push=false · auth fail · create-ref 403 · sem tokens

## Tip local
`c5da1e6d` · Vitest 149 · tsc OK

## Publish kit (corrigido)
**Problema encontrado:** `format-patch` multi-commit + `git apply` falhava no combined com prebuilt.
**Correcção:** diffs unificados:
- `kuteka-sprint-ab-unified.patch` (com prebuilt) — preferido
- `kuteka-sprint-ab-unified-src.patch` (src) + rebuild static no script

`PUBLISH-WHEN-WRITE-OPENS.sh` actualizado. apply --check: OK.

## Isolado
GOV-BF · 0043 · 0044 · 0045 proposta · tickets · Vicente
