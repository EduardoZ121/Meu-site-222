# Status — E-mail corporativo Kuteka

## Decisão oficial de destino (actualizada)

**Human / operational:** `@kutekalink.com` → Cloudflare Email Routing → **`kutekalink@gmail.com`**  
**Não usar** `vicentemakiese81@gmail.com`.

**Transactional:** App → Resend → `noreply@mail.kutekalink.com` (inalterado).

## Produção DNS
- Ainda **não** cutover (secrets ausentes) — site/NS inalterados
- Quando Routing for aplicado, regras usarão `EMAIL_FORWARD_TO` / default `kutekalink@gmail.com`

## Kit actualizado
- Script apply + `@kuteka/email` + docs reflectem o novo destino
