# Remake Pixel

Plataforma SaaS de geração de imagens, vídeos, pôsteres e ferramentas criativas com IA.

- **Produção:** https://www.remakepix.com
- **Repositório:** branch `main`
- **Deploy:** Vercel (Root Directory = `.`)

## Estrutura do projeto

```
Meu-site-222/
├── frontend/              # Aplicação principal (React + API serverless)
│   ├── src/               # UI, páginas, i18n (en, pt, es, fr)
│   ├── public/            # Assets estáticos (imagens, vídeos, capas)
│   ├── api/               # Backend Vercel (MongoDB, Stripe, Replicate, …)
│   └── scripts/           # Utilitários de dev (i18n, Stripe, testes locais)
├── backend/               # API Python FastAPI (desenvolvimento local / Railway)
├── scripts/               # Geração de capas, marketing, verificações de deploy
├── docs/                  # Guias de setup (Vercel, AWS, Google, SEO)
├── vercel.json            # Configuração de deploy (autoritativa)
├── middleware.js          # Redirect *.vercel.app → www.remakepix.com
├── package.json           # Deps auxiliares para funções /api na Vercel
└── REPO_BASELINE.md       # Regras de estrutura do repositório
```

## Desenvolvimento local

```bash
cd frontend
yarn install
yarn start          # http://localhost:3000
```

Variáveis de ambiente: copiar `.env.example` (se existir) ou usar `vercel env pull` na pasta `frontend/`.

## Build e verificação

```bash
node scripts/verify-single-site.mjs   # estrutura do repo
cd frontend && yarn build             # build de produção → frontend/build/
```

## Deploy

Push para `main` dispara deploy na Vercel. O `vercel.json` na raiz:

- Compila o CRA em `frontend/`
- Expõe `frontend/api/` como serverless em `/api/*`
- Cron a cada 3 min para finalizar gerações pendentes

Ver `docs/VERCEL-UNIFICAR.md` e `docs/HANDOFF.md` para transferência de propriedade.

## Onde editar

| Área | Caminho |
|------|---------|
| Páginas e componentes | `frontend/src/` |
| Traduções | `frontend/src/i18n/*.json` |
| API / billing / gerações | `frontend/api/` |
| Capa hero | `frontend/public/images/hero-bg.jpg` |
| Preços | `frontend/src/config/pricing.json` |

## Documentação adicional

- `REPO_BASELINE.md` — layout canónico e pastas proibidas
- `docs/HANDOFF.md` — checklist para venda / transferência
- `docs/PRD.md` — histórico de funcionalidades e decisões
- `docs/AWS-S3-SETUP.md`, `docs/GOOGLE-LOGIN.md`, `docs/GOOGLE-SEARCH-CONSOLE-PT.md`
- `AGENTS.md` — regras para assistentes de código (Cursor)
