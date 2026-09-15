# Correio corporativo Kuteka — Beta

## Separação de funções

| Função | Serviço | Identidade |
|--------|---------|------------|
| Recepção humana | **Cloudflare Email Routing** | `info@`, `support@`, `partnerships@`, `contacto@`, `privacidade@`, `juridico@` → Gmail destino Beta |
| Envio transacional app | **Resend** | `Kuteka <noreply@mail.kutekalink.com>` |
| Auth confirm/reset | **Supabase Auth SMTP → Resend** | mesmo remetente `noreply@mail.kutekalink.com` |

Email Routing **não** envia. Gmail SMTP **não** é infra de produção.

## Futuro Google Workspace

1. Desactivar Email Routing / remover MX Cloudflare no apex  
2. Publicar MX Google Workspace no apex  
3. Manter `mail.kutekalink.com` + Resend intactos  

Endereços públicos `@kutekalink.com` permanecem iguais.

## Apply automatizado

```bash
# Secrets no ambiente (nunca no git):
# CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
# GODADDY_API_KEY GODADDY_API_SECRET   # ou GODADDY_PAT=key:secret
# RESEND_API_KEY

# 1) Preparar zona CF + DNS site + Routing + Resend DNS — SEM cutover NS
SKIP_NS_CUTOVER=1 node scripts/email/apply-kuteka-email-stack.mjs

# 2) Após verificar A/www na zona CF Pending:
node scripts/email/apply-kuteka-email-stack.mjs
```

## Secrets aplicação / Render

| Variável | Uso |
|----------|-----|
| `RESEND_API_KEY` | Envio API + (como password) SMTP Supabase |
| `RESEND_FROM` | default `Kuteka <noreply@mail.kutekalink.com>` |
| `RESEND_REPLY_TO` | default `contacto@kutekalink.com` |
| `KUTEKA_MAIL_HOOK_SECRET` | Bearer para `POST /api/internal/mail/send` |

## Supabase Dashboard (obrigatório para confirm/reset reais)

Authentication → Emails → SMTP:

- Host: `smtp.resend.com`
- Port: `465` (SSL) ou `587`
- User: `resend`
- Password: valor de `RESEND_API_KEY`
- Sender: `noreply@mail.kutekalink.com`
- Confirm email: **ON**

## Pacote código

`@kuteka/email` — templates + cliente Resend (fetch).  
Hook: `apps/web/app/api/internal/mail/send/route.ts`

## Testes

1. Site `https://kutekalink.com` e `www` 200  
2. Enviar para `info@` / `support@` / `partnerships@` → Gmail destino  
3. `contacto@` / `privacidade@` / `juridico@` → mesmo destino  
4. `node` smoke Resend: sendTransactional test  
5. Signup + recuperar palavra-passe (após SMTP Supabase)  
6. SPF/DKIM/DMARC: dig TXT `_dmarc` / DKIM Resend / MX apex = Cloudflare  
