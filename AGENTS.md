# Instruções para agentes — Remake Pixel (único projeto)

Este repositório tem **uma** aplicação web: pasta `frontend/`. O backend é `backend/`.

## Caminhos obrigatórios

| Alteração | Ficheiro |
|-----------|----------|
| Site / UI | `frontend/src/` |
| Textos (PT/EN/ES/FR) | `frontend/src/i18n/*.json` — **nunca** hardcode inglês no JSX |
| Ícones | `lucide-react` já usado — não trocar biblioteca nem conjunto de ícones sem pedido explícito |
| Título / meta HTML | `frontend/public/index.html` |
| Imagem do hero | `frontend/public/images/hero-bg.jpg` |
| Hero (layout) | `frontend/src/sections/Hero.jsx` — só `img` + `useI18n`, sem vídeo |
| Deploy Vercel | `cd frontend && yarn build` — projeto **remakepix**, root `Meu-site-222/frontend` |

## Proibido

- Criar ou editar `index.html`, `package.json`, `components/` ou `images/` na **raiz** do repo.
- Restaurar Emergent: `emergent-main.js`, `Emergent | Fullstack App`, `@emergentbase/visual-edits`, badge Emergent.
- Hero em vídeo, `hero-cover.jpg`, `hero-new.jpg`, layout “full-bleed” experimental, ou rollback de deploy antigo sem pedido do utilizador.
- Substituir `t("...")` por strings fixas em inglês.
- Alias Vercel para deploys antigos / zip `frontend-completo.zip` / branches `hero-fix`.

## Alterações seguras

- **Só imagem do hero:** substituir `frontend/public/images/hero-bg.jpg`; opcional `?v=N` na `src` do `<img>` em `Hero.jsx`. Não mudar classes, CTAs, tipografia.
- **Copy / traduções:** editar chaves nos JSON i18n, manter as mesmas chaves em `pt`, `en`, `es`, `fr`.
- **Funcionalidade:** alterar ficheiros em `frontend/src/` ou `backend/`; correr `yarn build` em `frontend/` antes de concluir.

## Verificação

```bash
./scripts/verify-baseline.sh
cd frontend && yarn build
```

Se o script falhar, **não** fazer push nem deploy.
