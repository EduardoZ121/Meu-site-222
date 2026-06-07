# Agentes — Remake Pixel (um único site)

**Repo:** https://github.com/EduardoZ121/Meu-site-222  
**Raiz do workspace:** `/workspace` = raiz deste repo (não `meu-telegram-bot`, não subpasta `Meu-site-222/`).

## Regras

1. **Só editar** `frontend/`, `backend/`, `vercel.json`, `scripts/`.
2. **Nunca** recriar app na raiz (`components/`, `index.html`, `images/`).
3. **Capa:** `frontend/public/images/hero-bg.jpg` + cache bust em `Hero.jsx` (`?v=N`).
4. **Deploy:** `npx vercel deploy --prod --cwd /workspace` (token + org no ambiente).
5. Ler `REPO_BASELINE.md` antes de hero, i18n ou deploy.

## Vercel

- **Projeto de produção:** `remakepix` → https://remakepix.com (mover domínio para aqui se estiver no clone `meu-site-222`)
- **Clone Emergent:** `meu-site-222` — não usar; apagar depois de migrar domínio e variáveis
- Repo: `EduardoZ121/Meu-site-222`, branch `main`, Root Directory **`.`** no projeto remakepix
- Upload: **AWS S3** (não Blob). Guias: `docs/VERCEL-UNIFICAR.md`, `docs/AWS-S3-SETUP.md`
