# Deploy status — 2026-07-30 (actualizado 13:40 UTC)

## Feito (automático)

| Alvo                                    | Estado                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `main`                                  | Actualizado (`08a556d`) — KEOS Landing + publish path  |
| GitHub Actions Deploy Kuteka            | Verde                                                  |
| `gh-pages`                              | Landing nova no ar                                     |
| GitHub Pages (IP + Host kutekalink.com) | Título: **Kuteka — Património. Confiança. Habitação.** |

## Bloqueado: kutekalink.com / kutekalink.onrender.com

- DNS A `@` → `216.24.57.1` (origem Render)
- Conteúdo: marketplace Vite legado (`last-modified: 2026-06-30`)
- Deploy hooks Render aceitam (`200` + deploy id), mas o serviço **não publica** builds novos
- `RENDER_API_KEY` e `GODADDY_KEY` no ambiente → **401 Unauthorized**

## Desbloqueio (manual — 2 min)

### Opção A — DNS para GitHub Pages (recomendado agora)

No painel GoDaddy → DNS do `kutekalink.com`:

1. Apagar A de `@` que aponta para `216.24.57.1`
2. Criar A `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. CNAME `www` → `eduardoz121.github.io`

Ou com API válida: `legacy/scripts/configure-godaddy-dns-github.sh`

### Opção B — Reparar Render

Dashboard → static `kutekalink` (`srv-d8ov5g6gvqtc738m4jpg`):

- Ver logs do último deploy (provável falha/suspensão)
- Build: `npm install && npm run build`
- Publish: `dist`
- Node ≥ 20

O build em `main` copia `prebuilt/web-out` → `dist` (e o mesmo via `legacy/` se Root Directory = legacy).
