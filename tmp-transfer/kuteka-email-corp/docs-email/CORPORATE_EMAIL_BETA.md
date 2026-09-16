# Correio corporativo Kuteka — Beta

## Arquitectura oficial

### Human / operational

```
info@ / support@ / partnerships@ / contacto@ / privacidade@ / juridico@
        ↓
Cloudflare Email Routing
        ↓
kutekalink@gmail.com
```

Destino configurável via env `EMAIL_FORWARD_TO` (default: `kutekalink@gmail.com`).  
**Não** usar endereços pessoais como destino operacional.

### Transactional (aplicação)

```
Kuteka App / Supabase Auth SMTP
        ↓
Resend
        ↓
Kuteka <noreply@mail.kutekalink.com>
```

Email Routing **não** envia. Gmail SMTP **não** é infra de produção.  
Auth confirm/reset **não** passam pelo Routing — só Resend.

### Futuro Google Workspace

```
@kutekalink.com  →  MX Google Workspace  →  caixas empresariais
mail.kutekalink.com + Resend  →  inalterado
```

Endereços públicos `@kutekalink.com` permanecem iguais.

## Separação de funções

| Função | Serviço | Identidade |
|--------|---------|------------|
| Recepção humana | **Cloudflare Email Routing** | 6 endereços → `kutekalink@gmail.com` |
| Envio transacional app | **Resend** | `Kuteka <noreply@mail.kutekalink.com>` |
| Auth confirm/reset | **Supabase Auth SMTP → Resend** | mesmo remetente `noreply@mail.kutekalink.com` |

## Apply automatizado

```bash
# Secrets no ambiente (nunca no git / chat):
# CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
# GODADDY_PAT
# RESEND_API_KEY
# EMAIL_FORWARD_TO=kutekalink@gmail.com   # opcional; já é o default

SKIP_NS_CUTOVER=1 node scripts/email/apply-kuteka-email-stack.mjs
# após validar zona CF:
node scripts/email/apply-kuteka-email-stack.mjs
```

## Secrets aplicação / Render

| Variável | Uso |
|----------|-----|
| `RESEND_API_KEY` | Envio API + (como password) SMTP Supabase |
| `RESEND_FROM` | default `Kuteka <noreply@mail.kutekalink.com>` |
| `RESEND_REPLY_TO` | default `contacto@kutekalink.com` |
| `KUTEKA_MAIL_HOOK_SECRET` | Bearer para `POST /api/internal/mail/send` |
| `EMAIL_FORWARD_TO` | destino Routing (default `kutekalink@gmail.com`) |

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

## Testes (após Routing activo)

1. Site `https://kutekalink.com` e `www` 200  
2. `info@` / `support@` / `partnerships@` / `contacto@` / `privacidade@` / `juridico@` → `kutekalink@gmail.com`  
3. Transacional separado: From `noreply@mail.kutekalink.com` via Resend  
4. Signup + recuperar palavra-passe (após SMTP Supabase)  
5. SPF/DKIM/DMARC: dig TXT `_dmarc` / DKIM Resend / MX apex = Cloudflare  
