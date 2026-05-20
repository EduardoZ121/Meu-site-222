# Remake Pixel — único projeto (baseline)

**Repositório:** [EduardoZ121/Meu-site-222](https://github.com/EduardoZ121/Meu-site-222)  
**Produção:** Vercel `remakepix` · pasta de deploy `Meu-site-222/frontend`  
**Branch canónica:** `main` (commit baseline galeria / hero estável)

## Estrutura (só isto existe)

```
Meu-site-222/
├── frontend/          ← site React (ÚNICO frontend)
├── backend/           ← API Python
├── scripts/           ← verify-baseline.sh
├── AGENTS.md          ← regras para agentes
└── REPO_BASELINE.md   ← este ficheiro
```

Não deve existir na raiz: `index.html`, `package.json`, `components/`, `images/`, `*.zip`.

## Caminhos para alterações futuras

| O quê | Onde |
|--------|------|
| UI / páginas | `frontend/src/` |
| Textos (4 idiomas) | `frontend/src/i18n/pt.json`, `en.json`, `es.json`, `fr.json` |
| Ícones | `lucide-react` (não mudar biblioteca sem pedido) |
| Título do site | `frontend/public/index.html` → `Remake Pixel — Estúdio AI` |
| Capa hero | `frontend/public/images/hero-bg.jpg` |
| Hero (código) | `frontend/src/sections/Hero.jsx` — `useI18n`, `<img>`, sem vídeo |

## Preservar (não regredir)

- **Letras / copy:** chaves `t("...")` + ficheiros i18n; não substituir por inglês fixo no JSX.
- **Ícones:** manter os ícones Lucide já usados nos componentes.
- **Marca:** Remake Pixel, não “Emergent” nem “Fullstack App”.
- **Hero:** imagem estática `hero-bg.jpg`, opacidade ~50%, layout centrado actual.

## Proibido

- Emergent: `emergent-main.js`, `@emergentbase/visual-edits`, badge Emergent.
- Segunda app na raiz do repo ou zip `frontend-completo.zip`.
- Hero em vídeo, `hero-cover.jpg`, `hero-new.jpg`, rollback de deploy antigo.
- Alias Vercel para builds antigos sem pedido explícito do utilizador.

## Antes de push ou deploy

```bash
./scripts/verify-baseline.sh
cd frontend && yarn build
```

Antes de cada push, correr sempre `./scripts/verify-baseline.sh` (também via `cd frontend && yarn verify:baseline`).

## Enviar capa nova (anexo no chat **não chega** ao agente cloud)

1. No GitHub: substituir `frontend/public/images/hero-bg.jpg` pelo teu JPG (upload no browser).
2. Escrever no chat: **「capa no GitHub, deploy」** — o agente só faz deploy, **sem** inventar imagem do histórico.
