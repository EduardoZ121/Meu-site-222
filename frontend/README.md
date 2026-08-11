# Remake Pixel — frontend

Aplicação React + API serverless Vercel.

```bash
yarn install
yarn start    # dev em http://localhost:3000
yarn build    # output → build/
```

Documentação completa na raiz do repositório: `../README.md` e `../docs/HANDOFF.md`.

| Pasta | Conteúdo |
|-------|----------|
| `src/` | UI, páginas, bibliotecas, i18n |
| `public/` | Imagens, vídeos, capas de estilos |
| `api/` | Backend produção (deploy via symlink `api` na raiz) |
| `scripts/` | Ferramentas de dev (i18n, Stripe, testes) |
