> **Legado Vite — não usar para produto KEOS.** Auth oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`.

# Configuração de contas — Kuteka

| #   | Serviço             | Variável                | Estado                            |
| --- | ------------------- | ----------------------- | --------------------------------- |
| 1   | MongoDB (local dev) | `MONGODB_URI`           | **feito** — `127.0.0.1:27017`     |
| 2   | OpenAI              | `OPENAI_API_KEY`        | **feito**                         |
| 3   | AWS S3              | `AWS_*`                 | **feito** — `kuteka-uploads-prod` |
| 4   | Resend (email)      | `RESEND_API_KEY`        | **feito**                         |
| 5   | Google OAuth        | `VITE_GOOGLE_CLIENT_ID` | **feito**                         |
| 6   | JWT                 | `JWT_SECRET`            | **feito**                         |
| 7   | Pagamentos Kz       | TBD                     | **último** (não Stripe)           |

## Render (produção)

No dashboard Render, serviço **kuteka-api**, adicionar secrets:

- `MONGODB_URI` — Atlas ou URI de produção
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `AWS_*` (mesmos valores do `.env` local)

Frontend **kutekalink** usa `VITE_API_URL=https://kuteka-api.onrender.com/api` (já no `render.yaml`).

## MongoDB Atlas (opcional)

Substituir URI local:

```bash
npm run mongo:uri -- "mongodb+srv://..."
```

## Pagamentos em Kwanza

Pendente: Multicaixa / gateway local — Stripe fica de fora.
