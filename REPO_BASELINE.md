# Remake Pixel — único site (baseline)

**Repositório:** [EduardoZ121/Meu-site-222](https://github.com/EduardoZ121/Meu-site-222)  
**Branch:** `main` (site `cursor/i18n-reorg-301a` / commit de referência `d5b396f`)  
**Produção:** Vercel `remakepix` → https://remakepix.com · Root Directory = **`.`** · build = `frontend/build`  
**Nota:** clone Emergent `meu-site-222` — ver `docs/VERCEL-UNIFICAR.md` · uploads = **S3**, Blob desligado

## Estrutura permitida (só isto)

```
Meu-site-222/
├── frontend/          ← site React (ÚNICO frontend)
│   ├── src/
│   ├── public/
│   └── api/           ← serverless Vercel
├── backend/           ← API Python (local / Railway)
├── scripts/           ← utilitários opcionais
├── vercel.json
├── package.json       ← deps das funções /api na Vercel
└── README.md
```

## Onde editar

| O quê | Caminho |
|--------|---------|
| Páginas / UI | `frontend/src/` |
| Textos (4 idiomas) | `frontend/src/i18n/*.json` |
| Capa hero | `frontend/public/images/hero-bg.jpg` |
| Hero (código) | `frontend/src/sections/Hero.jsx` |
| Título | `frontend/public/index.html` |

## Proibido na raiz do repo

Não criar de novo: `components/`, `images/`, `index.html`, `src/` (CRA na raiz), `frontend-completo.zip`, `hero-bg.jpg` na raiz.

Capa nova → **sempre** `frontend/public/images/hero-bg.jpg`.

## Pastas removidas (não recriar)

- `src/`, `components/`, `public/` na raiz — cópias CRA antigas
- `frontend/frontend/` — clone Emergent duplicado
- `frontend/vercel.json` — **obrigatório** se o projeto Vercel tiver Root Directory = `frontend` (config atual do remakepix)
- `test_reports/`, `memory/`, `plan.md` — artefactos internos (histórico em `docs/PRD.md`)

## Antes de push

```bash
node scripts/verify-single-site.mjs
cd frontend && yarn build
```
