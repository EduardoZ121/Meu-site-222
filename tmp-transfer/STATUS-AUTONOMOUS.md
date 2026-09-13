# Status — timer probe 2026-09-13T17:06Z (publish-site-angola-when-write)

## Write gate
- `SITE_ANGOLA_PUSH_TOKEN`: **unset** neste ambiente
- `cursor[bot]` em `EduardoZ121/Site_Angola`: **push=false** (403 / sem write)
- **Missing permission exacta:** GitHub App / PAT com `contents: write` (push) em `EduardoZ121/Site_Angola` — Option A (Cursor App no repo) ou secret `SITE_ANGOLA_PUSH_TOKEN` no Cloud Agent env. Nunca Vicente.

## Closeout (já feito — não republicado)
- Tip `349d83db` merged PR #73 → `main` @ `5ae560e9`
- Deploy Kuteka + pages build: **success**
- Script `PUBLISH-CLOSEOUT.sh` **não corrido** (write fechado + já em produção)

## Smoke produção (re-probe deste timer)
| Check | Resultado |
|-------|-----------|
| `/health.json` | 200 `{status:ok,...}` |
| `/`, `/app/`, `/app/ajuda/`, `/app/admin/`, `/app/super/` | 200 |
| Hero «Beta pública» | OK |
| CSP meta no HTML | OK |
| Edge HTTP headers | só `x-content-type-options: nosniff` (CF Transform Rules pendentes) |

## A/B/C/D
- **A:** landing Beta, health, rotas core, merge/deploy closeout
- **B:** loop auth feedback→inbox (sem sessão teste); headers edge completos
- **C:** Cursor App write / `SITE_ANGOLA_PUSH_TOKEN`; CF secrets; credenciais teste; revogar PAT se foi colado em chat
- **D:** GOV-BF / 0043–45 / comercial-legal — Founder only
