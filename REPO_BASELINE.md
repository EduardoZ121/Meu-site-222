# Remake Pixel — baseline do repositório

**Não altere cópias antigas na raiz.** O site em produção (Vercel `remakepix`, pasta `Meu-site-222/frontend`) usa **apenas** este caminho:

| O quê | Caminho canónico |
|--------|------------------|
| App React | `frontend/src/` |
| HTML de build | `frontend/public/index.html` |
| Hero (imagem) | `frontend/public/images/hero-bg.jpg` + `frontend/src/sections/Hero.jsx` |
| Deploy | `cd frontend && yarn build` → `frontend/vercel.json` |
| Backend | `backend/` |

## O que NÃO fazer

- Não restaurar `index.html` na raiz do repo (tinha scripts Emergent).
- Não usar `frontend-completo.zip` nem branches antigas de “hero-fix”.
- Não fazer alias Vercel para deploys Emergent (`Emergent \| Fullstack App`, `emergent-main.js`).
- Troca de capa do hero = **só** `frontend/public/images/hero-bg.jpg` (e opcional `?v=N` em `Hero.jsx`), sem vídeo nem mudança de layout.

## Branch

Trabalhar em `main` ou branches `cursor/*-301a` a partir de `main` commit `6822301` (baseline galeria / deploy HDt8).
