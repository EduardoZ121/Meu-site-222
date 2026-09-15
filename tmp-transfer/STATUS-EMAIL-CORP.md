# Status — E-mail corporativo Kuteka (execução)

## Produção DNS (inalterada nesta ronda)
- NS: GoDaddy (`ns57/ns58.domaincontrol.com`)
- Site apex/www: OK (Render)
- MX: ainda nenhum

## Executado
- Script actualizado para **GODADDY_PAT** Bearer v3 (`gd_pat_…`) + cutover `PUT .../nameservers`
- Importação de inventário GoDaddy → zona CF antes do cutover
- Guia token CF mínimo: `docs-email/CLOUDFLARE_TOKEN_MINIMAL.md`
- Kit app `@kuteka/email` + hook (PR bridge)
- Pedido de secrets/ambiente registado

## Pendente (bloqueio de secrets)
| Secret | Uso |
|--------|-----|
| `GODADDY_PAT` | inventário + cutover NS (`domain:read`, `dns:update`, `nameserver:update`) |
| `CLOUDFLARE_API_TOKEN` | zona + DNS + Email Routing |
| `CLOUDFLARE_ACCOUNT_ID` | criar zona / destinations |
| `RESEND_API_KEY` | `mail.kutekalink.com` + SMTP Auth |
| Write Site_Angola | merge código (opcional `SITE_ANGOLA_PUSH_TOKEN`) |
| Supabase SMTP dashboard | após Resend verificado |

Quando os secrets estiverem no ambiente: correr `SKIP_NS_CUTOVER=1` depois apply completo — **sem** nova aprovação técnica.
