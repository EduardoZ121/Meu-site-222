# Status — publish bloqueado por permissão GitHub

Actualizado: 2026-09-13T15:55Z

## Diagnóstico exacto
- Identidade activa: `cursor[bot]`
- Repo: `EduardoZ121/Site_Angola`
- `permissions.push=false` · push HTTP **403**
- Permissão em falta: **Contents: write** (+ **Pull requests: write** para abrir PR)
- `SITE_ANGOLA_PUSH_TOKEN`: **ausente** no ambiente
- Vicente: não usado

## Pronto a publicar (local)
- Tip: `349d83db` em `/tmp/site-angola-publish`
- Branch alvo: `cursor/beta-final-closeout-f96b`
- Helper: `tmp-transfer/PUBLISH-CLOSEOUT.sh` (usa só env `SITE_ANGOLA_PUSH_TOKEN`, nunca imprime o valor)

## Acção Founder (uma destas)
1. **Option A:** Cursor GitHub App → acesso a `EduardoZ121/Site_Angola` (Contents + PRs write) e ligar o repo ao ambiente Cloud.
2. **Secret:** configurar `SITE_ANGOLA_PUSH_TOKEN` (PAT fine-scoped, Contents+PRs write só neste repo). **Não colar o token no chat.**

Pedido já registado no ambiente Cursor (`add_secrets` + `external_action`). Re-probe automático em ~10 min.
