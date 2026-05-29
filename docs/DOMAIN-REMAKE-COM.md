# Domínio **remake.com** — guia completo

O código do site já está preparado para **`https://www.remake.com`** (marca **Remake**).  
**Ninguém pode “criar” o domínio por ti** — tens de comprá-lo num registrador (~10–15 €/ano) e ligá-lo à Vercel.

---

## 1. Comprar o domínio `remake.com`

1. Entra num registrador, por exemplo:
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (preço custo, DNS fácil)
   - [Namecheap](https://www.namecheap.com/)
   - [Porkbun](https://porkbun.com/)
2. Pesquisa **`remake.com`** (sem “pix”).
3. Se estiver **disponível**, compra por 1 ano (ou mais).
4. Se estiver **ocupado**, só o dono actual pode vendê-lo — tenta contacto ou outro nome (`remake.studio`, `getremake.com`, etc.).

> **Nota:** `remake.com` pode já estar registado por outra empresa. Confirma disponibilidade antes de planear a marca.

---

## 2. Ligar o domínio à Vercel (projeto `remakepix`)

1. [Vercel Dashboard](https://vercel.com) → projeto **remakepix**
2. **Settings → Domains → Add**
3. Adiciona:
   - `remake.com`
   - `www.remake.com`
4. Copia os registos DNS que a Vercel mostrar.

---

## 3. DNS (no Cloudflare ou no teu registrador)

| Tipo | Nome | Valor (exemplo — usa o da Vercel) |
|------|------|----------------------------------|
| **CNAME** | `www` | `cname.vercel-dns.com` |
| **A** ou **ALIAS** | `@` (raiz) | IPs da Vercel **ou** redirect `www` |

Recomendação: site principal em **`https://www.remake.com`** e redirect de `remake.com` → `www`.

Aguarda propagação (5 min – 48 h).

---

## 4. Variáveis na Vercel (Production)

Em **remakepix → Settings → Environment Variables**:

| Variável | Valor |
|----------|--------|
| `REACT_APP_SITE_ORIGIN` | `https://www.remake.com` |
| `REACT_APP_BRAND_NAME` | `Remake` |
| `REACT_APP_BRAND_FULL_NAME` | `Remake — Estúdio AI de imagem e vídeo` (opcional) |
| `SITE_URL` | `https://www.remake.com` (API / emails) |
| `SUPPORT_EMAIL` | `suporte@remake.com` (se tiveres caixa nesse domínio) |

O build na Vercel corre `scripts/sync-site-origin.js` antes do CRA (só altera `index.html` quando `REACT_APP_SITE_ORIGIN` está definido). Depois de comprar o domínio, faz **Redeploy** em Production.

---

## 5. Google Login (OAuth)

[Google Cloud Console](https://console.cloud.google.com) → APIs → Credentials → OAuth client:

**Authorized JavaScript origins:**

- `https://www.remake.com`
- `https://remake.com`

**Authorized redirect URIs:** (se usares redirect explícito)

- `https://www.remake.com`
- `https://www.remake.com/login`

Mantém também os URLs antigos (`remakepix.com`) até migrares utilizadores.

---

## 6. AWS S3 (uploads de imagens)

No bucket S3 → **CORS**, inclui:

```json
"AllowedOrigins": [
  "https://www.remake.com",
  "https://remake.com",
  "https://remakepix.com",
  "https://www.remakepix.com",
  "https://*.vercel.app"
]
```

---

## 7. Redirecionar o domínio antigo (opcional)

As regras estão em `vercel.redirects.remake.com.json`. **Não estão activas** no deploy actual até correres:

```bash
./scripts/activate-remake-domain.sh
git add vercel.json frontend/public/index.html
git commit -m "chore: activate remake.com redirects"
git push
```

Só faz isto depois de **remake.com** estar verificado na Vercel; até lá, **remakepix.com** continua a funcionar sem redirects.

---

## 8. Verificar

1. `https://www.remake.com` abre o site
2. `https://www.remake.com/api/health` responde JSON
3. Login Google funciona
4. Upload de imagem no estúdio funciona

---

## O que já está no repositório

- `frontend/src/lib/siteConfig.js` — origem, marca e email de suporte
- `frontend/api/lib/siteOrigin.cjs` — mesma lógica nas API routes
- `scripts/sync-site-origin.js` — meta tags no `index.html` no build
- `scripts/merge-vercel-redirects.js` + `vercel.redirects.remake.com.json`
- `scripts/check-remake-domain-ready.sh` — lista o que falta
- `docs/env.remake.com.example` — variáveis para copiar na Vercel

Quando comprares o domínio: passos 2–4, `./scripts/activate-remake-domain.sh`, commit, redeploy.

**Não é possível registar `remake.com` por ti** — só um registrador (com pagamento) pode comprar o domínio.
