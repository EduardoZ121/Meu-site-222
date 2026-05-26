# Unificar Vercel — remakepix.com (um só projeto)

## Situação (confirmada em 26/05/2026)

Tens **dois projetos** na mesma conta que ambos listam `https://remakepix.com`:

| Projeto | Domínio | Variáveis (Replicate, Mongo, Stripe) | Root no repo |
|---------|---------|--------------------------------------|--------------|
| **meu-site-222** | **remakepix.com aponta AQUI** | Em geral **vazias ou incompletas** | `.` (correto) |
| **remakepix** | Também ligado ao domínio no painel | **Completas** + Blob | `frontend` (antigo, errado) |

O que vês em https://remakepix.com/api/health no projeto **meu-site-222**:

- `replicate: false`, `mongo: false`, `stripe: false` → o site **não gera** até copiares as chaves para este projeto.

Os deploys feitos pelo agente no projeto **remakepix** **não** são o que o domínio mostre se o domínio estiver só no **meu-site-222**.

---

## O que fazer (ordem)

### 1. Ficar só com **meu-site-222** (já tens o domínio aqui)

1. [Vercel Dashboard](https://vercel.com) → projeto **meu-site-222**
2. **Settings → Git** → repositório `EduardoZ121/Meu-site-222`, branch `main`
3. **Settings → General → Root Directory** = **`.`** (raiz, não `frontend`)
4. **Settings → Build** → deve usar `vercel.json` na raiz (build em `frontend/build`)

### 2. Copiar variáveis do projeto **remakepix** → **meu-site-222**

No projeto **remakepix**: Settings → Environment Variables → abre cada uma e copia para **meu-site-222** (Production + Preview).

**Obrigatórias para o site funcionar:**

- `REPLICATE_API_TOKEN`
- `MONGO_URL` (se existir no remakepix; sem isto `mongo: false`)
- `DB_NAME`
- `STRIPE_SECRET_KEY` (+ chaves Stripe públicas se houver)
- `REACT_APP_GOOGLE_CLIENT_ID`
- `ADMIN_EMAILS`
- KV / Redis se usares

**Adicionar no meu-site-222:**

- `DISABLE_VERCEL_BLOB` = `1` (Production, Preview, Development)

**Não copiar / apagar no meu-site-222:**

- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- `BLOB_WEBHOOK_PUBLIC_KEY`

### 3. Apagar o Blob (quando o painel não deixa)

A Vercel **bloqueia** apagar `BLOB_*` enquanto o **Blob Store** estiver ligado ao projeto.

1. Projeto **remakepix** (ou meu-site-222 se tiver Storage) → **Storage**
2. Blob store → **Disconnect** / **Delete**
3. Depois **Settings → Environment Variables** → Remove `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`

Repete nos dois projetos se aparecer nos dois.

### 4. Domínio só num projeto

1. Projeto **remakepix** → **Settings → Domains** → remove `remakepix.com` e `www.remakepix.com`
2. Projeto **meu-site-222** → **Domains** → mantém `remakepix.com` (e www se usares)

### 5. Desativar o projeto duplicado (opcional)

- **remakepix** → Settings → no fundo **Delete Project** (só depois de copiares as variáveis e tirares o domínio)

Ou deixa parado sem domínio para não confundir.

### 6. Redeploy

**meu-site-222** → Deployments → **Redeploy** o último `main` (sem cache).

Confirma: https://remakepix.com/api/health

- `build`: `upload-no-blob-v1`
- `blob_disabled`: `true`
- `replicate`: `true`
- `mongo`: `true`
- `stripe`: `true`

---

## Deploy a partir do código (agente / local)

Na raiz do repo (com CLI ligada ao **meu-site-222**):

```bash
cd /caminho/Meu-site-222
vercel link --project meu-site-222
vercel deploy --prod
```

Não uses `vercel deploy` no projeto **remakepix** se o domínio for o **meu-site-222**.

---

## Outros projetos na conta (podes ignorar)

- `remakepixel-landing`, `frontend`, `meu-site-2`, etc. — não são o site principal salvo se tiverem outro URL.
