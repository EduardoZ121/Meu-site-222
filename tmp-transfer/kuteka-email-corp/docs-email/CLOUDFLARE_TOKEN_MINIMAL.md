# Cloudflare API Token — Kuteka Email (mínimo privilégio)

**Não use Global API Key.**

## Pré-requisito
Se `kutekalink.com` ainda não está na Cloudflare: Dashboard → Add a site → kutekalink.com → **não** altere NS ainda (deixe Pending).

## Criar token
1. Abra https://dash.cloudflare.com/profile/api-tokens  
2. **Create Token** → **Create Custom Token**  
3. Nome: `kuteka-email-kutekalink`  
4. **Permissions** (mínimas):
   - Zone → **Zone** → **Read**
   - Zone → **DNS** → **Edit**
   - Zone → **Email Routing Addresses** → **Edit** *(ou Account → Email Routing Addresses → Edit)*
   - Zone → **Email Routing Rules** → **Edit**
5. **Zone Resources:** Include → Specific zone → `kutekalink.com`  
   - Se a zona ainda não existir: Include → All zones *temporariamente*, ou adicione o site primeiro e depois restrinja.
6. **Account Resources:** Include → a conta Kuteka  
7. Continue → Create Token → copiar **uma vez** para o secret `CLOUDFLARE_API_TOKEN` (ambiente Cloud Agent / secrets — **nunca no chat**).
8. Account ID (Overview da conta) → secret `CLOUDFLARE_ACCOUNT_ID`.

## GoDaddy PAT scopes (gd_pat_…)
Mínimo:
- `domains.domain:read`
- `domains.dns:update`
- `domains.nameserver:update` ← obrigatório para cutover NS

Secret: `GODADDY_PAT` (Bearer). Sem `API_KEY`/`API_SECRET` se o PAT tiver estes scopes.

## Resend
API Key (Sending) → secret `RESEND_API_KEY`. Domínio `mail.kutekalink.com` criado pela automação.
