# Status — E-mail corporativo Kuteka Beta

## Bloqueios externos (impedem cutover em produção)

| Secret / acesso | Estado |
|-----------------|--------|
| `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | **ausente** |
| `GODADDY_API_KEY` + `GODADDY_API_SECRET` (ou `GODADDY_PAT=key:secret`) | **ausente** |
| `RESEND_API_KEY` | **ausente** |
| Push `EduardoZ121/Site_Angola` | **403** cursor[bot] |
| Supabase Dashboard SMTP | requer acção humana após Resend |

## Feito neste ambiente (pronto a aplicar)

- Inventário + backup DNS público (`dns-backup-before.txt`)
- Pacote `@kuteka/email` (templates + Resend fetch client + testes)
- Script idempotente `scripts/email/apply-kuteka-email-stack.mjs`
- Hook `POST /api/internal/mail/send`
- Doc `docs/operations/email/CORPORATE_EMAIL_BETA.md`
- Kit bridge: `tmp-transfer/kuteka-email-corp/`

## Arquitectura (decisões tomadas)

- Human: CF Email Routing → `vicentemakiese81@gmail.com` (6 endereços)
- Transacional: Resend `mail.kutekalink.com` / `noreply@mail.kutekalink.com`
- Apex MX reservado a Routing (futuro: Workspace); envio isolado no subdomínio
- Site A `@` → Render `216.24.57.1` DNS-only; www CNAME apex

## Próximo passo (quando secrets existirem)

```bash
SKIP_NS_CUTOVER=1 node scripts/email/apply-kuteka-email-stack.mjs
# validar zona CF
node scripts/email/apply-kuteka-email-stack.mjs   # cutover NS
# verificar Gmail destination + dig MX
# Supabase SMTP → Resend
```
