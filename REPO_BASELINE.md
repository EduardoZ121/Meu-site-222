# Remake Pixel — único site (baseline)

**Repositório:** [EduardoZ121/Meu-site-222](https://github.com/EduardoZ121/Meu-site-222)  
**Branch:** `main` (site `cursor/i18n-reorg-301a` / commit de referência `d5b396f`)  
**Produção:** Vercel `meu-site-222` → https://remakepix.com · Root Directory = repo raiz · build = `frontend/build`  
**Nota:** existe projeto duplicado `remakepix` na mesma conta — ver `docs/VERCEL-UNIFICAR.md`

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

## Antes de push

```bash
node scripts/verify-single-site.mjs
cd frontend && yarn build
```
