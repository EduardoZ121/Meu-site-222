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

- Projeto: `remakepix`
- Repo: `Meu-site-222`, branch `main`
- Build: `cd frontend && yarn build` → `frontend/build`
