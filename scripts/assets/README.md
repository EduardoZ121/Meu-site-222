# Referências para capas da grelha (Flyer / Padrão)

Coloca aqui as fotos base:

- `ref_woman.jpg` — rosto/corpo da mulher
- `ref_man.jpg` — rosto/corpo do homem
- `ref_user_woman.jpg` — referência enviada pelo utilizador (mulher)
- `ref_user_man.jpg` — referência enviada pelo utilizador (homem)

Depois corre na raiz do projeto:

```bash
node scripts/generate-flyer-covers.mjs
```

O script grava em `frontend/public/images/padrao-covers/fl_*.jpg` e usa os prompts da categoria **flyer** em `publicFallbacks.js`.
