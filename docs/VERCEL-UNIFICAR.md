# Vercel — projeto certo: **remakepix**

## Quem é quem

| Projeto | O que é | O que fazer |
|---------|---------|-------------|
| **remakepix** | Site original, ligado ao GitHub `EduardoZ121/Meu-site-222` | **Este é o certo** — domínio + variáveis aqui |
| **meu-site-222** | Clone criado no Emergent para editar | **Não usar** — tirar `remakepix.com` daqui e apagar o projeto quando puderes |

Hoje o domínio **remakepix.com** ainda pode estar no **meu-site-222** (clone sem as chaves certas). Por isso o site falha mesmo com código bom no GitHub.

---

## Plano em 6 passos (faz por esta ordem)

### 1. Domínio só no **remakepix**

1. Projeto **meu-site-222** → Settings → **Domains** → remove `remakepix.com` e `www`
2. Projeto **remakepix** → Settings → **Domains** → adiciona `remakepix.com` (+ `www` se usares)

### 2. Ajustar o projeto **remakepix** (ligação ao repo)

Settings → **General**:

- **Root Directory:** `.` (ponto = raiz do repo, **não** `frontend`)
- **Git:** repositório `EduardoZ121/Meu-site-222`, branch `main`

O `vercel.json` na raiz define o build (`frontend/build` + API).

### 3. Apagar o Blob na Vercel (não só a variável)

Enquanto existir **Storage → Blob** ligado, o painel **não deixa** apagar `BLOB_READ_WRITE_TOKEN`.

1. Projeto **remakepix** → **Storage** → Blob → **Disconnect / Delete**
2. **Settings → Environment Variables** → apagar:
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_STORE_ID`
   - `BLOB_WEBHOOK_PUBLIC_KEY`
3. Adicionar (se ainda não existir):
   - `DISABLE_VERCEL_BLOB` = `1` (Production, Preview, Development)

Repete no **meu-site-222** se lá também tiver Blob, antes de apagares esse projeto.

### 4. Configurar **AWS S3** no **remakepix** (substitui o Blob)

Em **remakepix** → Environment Variables → Production:

| Variável | Exemplo |
|----------|---------|
| `AWS_S3_BUCKET` | nome-do-bucket |
| `AWS_S3_REGION` ou `AWS_REGION` | `eu-west-1` |
| `AWS_ACCESS_KEY_ID` | chave IAM |
| `AWS_SECRET_ACCESS_KEY` | segredo IAM |
| `AWS_CLOUDFRONT_DOMAIN` | `d123abc.cloudfront.net` (opcional mas recomendado) |

IAM: permissões `s3:PutObject` no bucket (e leitura pública ou CloudFront).

Confirma: `https://remakepix.com/api/health` → `"s3": true`, `"blob": false`, `"blob_disabled": true`

### 5. Manter as outras chaves no **remakepix**

Copia do que já tens (ou do clone) para o projeto **remakepix**:

- `REPLICATE_API_TOKEN`
- `MONGO_URL`
- `DB_NAME`
- `STRIPE_SECRET_KEY`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `ADMIN_EMAILS`
- KV/Redis se usares

### 6. Redeploy e apagar o clone

1. **remakepix** → Deployments → Redeploy **main** (sem cache)
2. Quando `remakepix.com` responder com `replicate: true` e `mongo: true`, podes **apagar** o projeto **meu-site-222** no Vercel

---

## Como o upload funciona (sem Blob)

- **Fotos:** comprimir no telemóvel → POST directo (~3 MB)
- **Fotos ainda grandes / vídeos:** browser → **S3** (URL assinada) → API só recebe o link
- **Blob:** desligado no código; não é necessário plano Blob na Vercel

---

## Deploy pelo terminal (projeto certo)

```bash
cd Meu-site-222
vercel link --project remakepix
vercel deploy --prod
```

Não uses `meu-site-222` para deploy de produção.
