# Handoff — transferência do Remake Pixel

Checklist para vender ou entregar o projeto a um novo proprietário.

## 1. O que está incluído

| Componente | Descrição |
|------------|-----------|
| **Frontend** | React 19 + Tailwind + React Router (`frontend/src/`) |
| **API produção** | Vercel serverless (`frontend/api/`) — MongoDB, Stripe, Replicate, OpenAI, Blob/S3 |
| **Backend opcional** | FastAPI Python (`backend/`) — desenvolvimento local, não usado em produção Vercel |
| **Scripts** | Geração de capas, ads Instagram, verificações (`scripts/`, `frontend/scripts/`) |
| **i18n** | Inglês, português, espanhol, francês |

## 2. Contas e serviços externos

O comprador precisa de acesso ou migração para:

- **Vercel** — hosting + serverless + cron
- **MongoDB Atlas** (ou compatível) — utilizadores, galeria, gerações pendentes
- **Stripe** — pagamentos e créditos
- **Replicate** — modelos de imagem/vídeo
- **OpenAI** — melhoria de prompts, alguns pôsteres
- **Google OAuth** — login com Google
- **Vercel Blob ou AWS S3** — armazenamento permanente de media (ver `docs/AWS-S3-SETUP.md`)
- **Domínio** — `remakepix.com` (DNS na Vercel ou externo)

## 3. Variáveis de ambiente (Vercel)

Configurar no dashboard Vercel → Settings → Environment Variables. **Nunca commitar** ficheiros `.env*`.

Variáveis típicas (nomes aproximados — confirmar em `frontend/api/lib/`):

- `MONGODB_URI`
- `REPLICATE_API_TOKEN`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET` / JWT signing
- `CRON_SECRET` (proteção do cron `finalize-pending`)
- `BLOB_READ_WRITE_TOKEN` ou credenciais S3 (conforme setup)
- `SITE_URL` = `https://www.remakepix.com`

Após transferência: **rodar todas as chaves** (Stripe, Replicate, MongoDB user, etc.).

## 4. Deploy

1. Conectar repositório GitHub à Vercel
2. Root Directory: **`.`** (raiz do repo)
3. Framework: Create React App (definido em `vercel.json`)
4. Branch de produção: `main`
5. Após primeiro deploy: testar `/api/health`, login Google, uma geração de imagem, galeria

```bash
node scripts/verify-single-site.mjs
cd frontend && yarn build
```

## 5. Estrutura — o que NÃO deve existir

O script `scripts/verify-single-site.mjs` falha se houver duplicados antigos:

- `src/`, `components/`, `public/` na **raiz**
- `frontend/frontend/` (cópia Emergent antiga)
- `frontend/build/` commitado (é output de build)

## 6. Ficheiros sensíveis (remover do disco antes de partilhar)

- `.env.vercel`, `frontend/.env.local`, `frontend/.env.production.local`
- `frontend/scripts/.stripe-webhook-secret.local`
- Qualquer ficheiro com tokens ou `whsec_`

Estes paths estão no `.gitignore` mas podem existir localmente.

## 7. Funcionalidades principais

- **Personalizar** (`/app/generate`) — estilos com foto + prompt
- **Estúdio artístico** (`/app/artistic`)
- **Pôsteres, vídeo, manga, carrossel, ferramentas** (bg remove, upscale, etc.)
- **Galeria** — histórico de gerações com favoritos e download
- **Créditos + Stripe** — pacotes e billing server-side
- **Discover** — showcase público
- **Admin** — vídeo edit (Wan), relatórios

## 8. Suporte pós-venda (sugestão)

- Monitorizar cron `/api/cron/finalize-pending` (a cada 3 min)
- Logs Vercel para erros 5xx em `/api/*`
- Stripe Dashboard → webhooks ativos para `/api/webhooks/stripe`
