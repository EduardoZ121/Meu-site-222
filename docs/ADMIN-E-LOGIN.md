> **Legado Vite — não usar para produto KEOS.** Auth oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`.

# Admin e login (Kuteka)

## Login (`/entrar`)

- Ecrã dedicado em página completa (não aparece em baixo do site).
- Entrada com **Google** — sem palavra-passe extra.
- Quem **não** está logado pode ver casas, carros e anúncios.
- Login **obrigatório** para:
  - Publicar anúncio (`/publicar`)
  - Adicionar propriedade (`/adicionar-propriedade`)
  - Favoritos e comparar
  - Minha conta (`/conta`)
  - Favoritar, comparar ou chat num anúncio

Ao clicar num destes botões sem sessão, o site redirecciona para `/entrar?redirect=...` e depois do login volta à página pedida.

## Administrador

**Email único com acesso admin:**

```txt
amarilinhaa@gmail.com
```

No painel `/admin` (só visível para este email):

1. **Utilizadores** — quem entrou com Google (nome, email, datas de login).
2. **Aprovar anúncios** — casas, carros, etc. com status _Pendente_ até aprovação.
3. **Rejeitar** — com motivo opcional.
4. **Gerir anúncios** — pausar, destacar ou apagar.
5. **Actividade** — últimas notificações do site (demo local).

> Os dados ficam no `localStorage` do browser até existir backend. Em produção real, utilizadores e anúncios devem ir para API + base de dados.

## Deploy no Render

O código está em `main` no GitHub. Se o site não actualizar sozinho:

1. Render Dashboard → serviço **kutekalink** → **Manual Deploy** → Deploy latest commit.
2. Ou configure **Deploy Hook** e variável `RENDER_DEPLOY_HOOK_URL` (já existe como secret no GitHub).

Build: `npm ci && npm run build` — pasta `dist`.
