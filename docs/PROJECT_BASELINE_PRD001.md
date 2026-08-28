# PROJECT_BASELINE_PRD001 — Baseline congelada pós-PRD-001

**Estado:** ✅ **Congelada** (2026-07-31)  
**Decisão PO:** Encerrar PRD-001; não investir em polish cosmético do stub `/app`.  
**Commit de referência (merge encerramento):** `c2b5720` · PR [#13](https://github.com/EduardoZ121/Site_Angola/pull/13)  
**Produção:** https://kutekalink.com  
**Encerramento N5:** `docs/backlog/PRD_001_CLOSURE.md`  
**Spec:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**ADR:** `docs/architecture/ADR-004-authentication-module-deferred.md`

> Esta baseline é a fotografia oficial do produto após Autenticação (PRD-001).  
> Alterações ao âmbito PRD-001 só para **bugs críticos** que impeçam o fluxo auth.  
> Trabalho seguinte: **Fase 3 — Shell da Plataforma** (ver `docs/backlog/PHASE_3_PLATFORM_SHELL_PREP.md`).

---

## 1. Versão da plataforma

| Campo                            | Valor                                                            |
| -------------------------------- | ---------------------------------------------------------------- |
| Produto                          | KEOS — Kuteka Engineering Operating System                       |
| Versão monorepo (`package.json`) | `0.1.0`                                                          |
| App web (`@kuteka/web`)          | `0.1.0`                                                          |
| Stack                            | Next.js 15 · React 19 · TypeScript · Tailwind · pnpm · Turborepo |
| Deploy publish                   | `prebuilt/web-out` → `dist` → GitHub Pages + Render              |
| Domínio                          | `kutekalink.com`                                                 |
| Baseline tag lógica              | **PRD-001-N5 / 2026-07-31**                                      |

---

## 2. Funcionalidades implementadas

### 2.1 Autenticação (F1–F6)

| Fluxo              | Rotas                                                 | Capacidade                                           |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| F1 Registo         | `/auth/registar`                                      | Email + password (regras R4); termos; anti-enum (R6) |
| F2 Verificar email | `/auth/verificar`                                     | Confirmação / reenvio; compatível com autoconfirm    |
| F3 Entrar          | `/auth/entrar`                                        | Login; `next` seguro (R3)                            |
| F4 Sair            | `/auth/sair`                                          | Terminar sessão                                      |
| F5 Recuperar       | `/auth/recuperar` · `/auth/recuperar/confirmar`       | Reset password                                       |
| F6 Onboarding      | `/auth/onboarding/papeis` · `/auth/onboarding/perfil` | Papéis self-serve + nome de apresentação             |

### 2.2 Conta e papéis

- Uma pessoa = uma conta; múltiplos papéis na mesma conta
- Self-serve: `client`, `patrimonial_partner` via RPC `activate_self_serve_roles`
- Papéis `certified_agent` / `administrator` só por atribuição administrativa
- Permissões oficiais: `platform.access`, `admin.panel` (fonte PostgreSQL)

### 2.3 Área autenticada (stub)

- `/app` — espaço Kuteka (welcome, estado da conta, papéis, próximos módulos stub)
- `/app/admin` — stub admin com gate `admin.panel`
- Chrome: BrandMark (símbolo + KUTEKA), utilizador, papéis, terminar sessão

### 2.4 Marketing / Landing

- Landing oficial + CTAs → `/auth/registar` · `/auth/entrar`
- Páginas: `/contacto`, `/termos`, `/privacidade`

### 2.5 Fundação prévia (incluída na baseline)

- Monorepo KEOS, Design System `@kuteka/ui`, packages partilhados
- P0 RBAC + audit (`0002`)
- CI quality + Deploy Kuteka

---

## 3. Arquitectura actual

```
apps/web                    Produto (App Router + static export)
  app/(marketing)           Landing e páginas públicas
  app/(auth)                Fluxos F1–F6
  app/(app)                 Stub autenticado
  modules/authentication    Domínio auth (UI, services, content, gate)
  modules/landing           Landing
  modules/*                 Placeholders futuros (patrimonios, kai, …)
packages/
  auth · database · validation · types · ui · shared · config
supabase/
  migrations/0001–0003 · seed/0001_roles.sql
prebuilt/web-out            Snapshot estático publicado
legacy/                     Protótipo Vite — não usar
```

### Decisões técnicas relevantes

| Tema           | Decisão                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| Sessão browser | `localStorage` key `kuteka-auth` (PKCE); adepto de static host                       |
| Gate `/app`    | Cliente (`AppShell`) — cookies SSR não fiáveis no export estático                    |
| Config pública | `window.__KUTEKA_CONFIG__` via `/kuteka-config.js`                                   |
| `next`         | `resolveSafeNextPath` em `@kuteka/auth`                                              |
| RBAC           | RPCs `get_user_role_codes` / `get_user_permission_codes`; sem matriz duplicada em TS |
| Audit          | `write_audit_log` (eventos canónicos §13)                                            |
| Deploy         | Static export (`STATIC_EXPORT=1`); middleware/API stashed no build estático          |

---

## 4. Estrutura das páginas

### Públicas / marketing

| Path           | Função      |
| -------------- | ----------- |
| `/`            | Landing     |
| `/contacto`    | Contacto    |
| `/termos`      | Termos      |
| `/privacidade` | Privacidade |

### Auth

| Path                        | Função                  |
| --------------------------- | ----------------------- |
| `/auth`                     | Entrada / redirect modo |
| `/auth/registar`            | F1                      |
| `/auth/entrar`              | F3                      |
| `/auth/verificar`           | F2                      |
| `/auth/recuperar`           | F5 pedido               |
| `/auth/recuperar/confirmar` | F5 confirmar            |
| `/auth/onboarding/papeis`   | F6 papéis               |
| `/auth/onboarding/perfil`   | F6 perfil               |
| `/auth/sair`                | F4                      |

### App (stub)

| Path         | Função             |
| ------------ | ------------------ |
| `/app`       | Espaço autenticado |
| `/app/admin` | Admin stub         |

### Dev (não produto)

| Path              | Função           |
| ----------------- | ---------------- |
| `/dev/ui`         | Catálogo DS      |
| `/dev/auth-check` | Diagnóstico auth |

---

## 5. Estado do Supabase

| Campo           | Valor                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Project ref     | `vhqwitbrpqaiutjbundo`                                                                    |
| Região          | eu-west-1                                                                                 |
| URL             | `https://vhqwitbrpqaiutjbundo.supabase.co`                                                |
| Auth Site URL   | `https://kutekalink.com`                                                                  |
| Runtime cliente | `/kuteka-config.js` (anon key pública)                                                    |
| Secrets CI/CD   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`  |
| Nota ops        | Free tier: limites de email; `mailer_autoconfirm` usado para desbloquear fluxos em testes |

---

## 6. Migrations aplicadas

Ordem canónica no remoto:

| Migration                              | Conteúdo                                  |
| -------------------------------------- | ----------------------------------------- |
| `0001_foundation.sql`                  | Fundação schema (profiles, roles base, …) |
| `0002_p0_rbac_and_audit_hardening.sql` | RBAC RPCs + audit hardening (P0/P2)       |
| `0003_activate_self_serve_roles.sql`   | RPC `activate_self_serve_roles`           |

Seed:

| Seed             | Conteúdo                                           |
| ---------------- | -------------------------------------------------- |
| `0001_roles.sql` | Roles oficiais + `platform.access` / `admin.panel` |

---

## 7. PRs utilizados (trilho até baseline)

| PR  | Título (resumo)                                 |
| --- | ----------------------------------------------- |
| #1  | FASE 1 — foundation + ADR-001                   |
| #2  | Landing Page oficial                            |
| #3  | P0_PRE_AUTH — RBAC + audit + CI                 |
| #4  | Spec PRD-001 v0.2                               |
| #5  | Módulo Authentication (P2 diferido no arranque) |
| #6  | Deploy lockfile + polish stubs                  |
| #7  | Runtime Supabase config; E3/E4                  |
| #8  | Supabase remoto + P2 fechado                    |
| #9  | Auth UI polish + rate-limit                     |
| #10 | Sessão localStorage / papéis                    |
| #11 | QA Review 001                                   |
| #12 | QA Review 002 (`/app` UX)                       |
| #13 | Encerramento documental N5                      |

---

## 8. Limitações conhecidas

1. **`/app` é stub** — sem Shell de produto (sidebar/nav de módulos).
2. **Static export** — sem middleware Next em produção; sessão em `localStorage`, não cookies SSR.
3. **Email Auth** — limites de rate do plano free; templates de marca (P4) opcionais.
4. **Sem OAuth / MFA / telefone** — fora do PRD-001.
5. **Sem UI de gestão de papéis** pós-onboarding.
6. **Vercel project `kuteka-api`** — checks de preview podem falhar; não é o host de produção KEOS.
7. **Deploy activo** usa `npm` + `prebuilt` (não rebuild pnpm no Actions Deploy).
8. **Módulos** `patrimonios`, `kai`, etc. existem como pastas placeholder — sem produto.

---

## 9. Backlog remanescente (fora do PRD-001)

| Prioridade   | Item                                                      |
| ------------ | --------------------------------------------------------- |
| **Próximo**  | Fase 3 — Shell da Plataforma                              |
| Seguinte     | PRD-002 — Parceiro Patrimonial                            |
| Depois       | PRD-003 Cliente · PRD-004 Agente · PRD-005 Admin          |
| Opcional ops | P4 templates email Kuteka                                 |
| Opcional ops | E1 — `deploy.yml` activo em pnpm                          |
| Futuro       | Passaporte / SCK / KAI / Marketplace / Wallet / Contratos |

---

## 10. Critérios para considerar esta baseline estável

A baseline **PRD-001-N5** considera-se estável quando **todos** os pontos seguintes se verificam (estado actual: ✅):

1. ✅ Fluxo Registo → Verificação → Login → Onboarding → `/app` funcional em produção
2. ✅ Logout `/auth/sair` funcional
3. ✅ Sessão persistente no browser (`kuteka-auth`) sem mensagem genérica falsa de rede em `/app`
4. ✅ Migrations `0001`–`0003` + seed aplicados no projecto remoto
5. ✅ CI quality verde na `main`
6. ✅ Deploy Kuteka verde (gh-pages + Render hook)
7. ✅ Domínio `kutekalink.com` a servir KEOS
8. ✅ Encerramento N5 documentado (`PRD_001_CLOSURE.md`) e aceite pelo PO
9. ✅ Sem bugs críticos abertos que impeçam autenticação

**Regra de congelamento:** mudanças no código/docs de auth só para (a) bugs críticos de funcionamento, ou (b) requisitos explícitos de um PRD futuro que consuma auth sem redesenhar o módulo.

---

## 11. Referências rápidas

| Documento                                      | Uso               |
| ---------------------------------------------- | ----------------- |
| `docs/backlog/PRD_001_CLOSURE.md`              | Encerramento N5   |
| `docs/AI_CONTEXT.md`                           | Roadmap de fases  |
| `docs/backlog/CONTINUIDADE_DESENVOLVIMENTO.md` | Onde paramos      |
| `docs/backlog/PHASE_3_PLATFORM_SHELL_PREP.md`  | Preparação Fase 3 |
| `docs/architecture/ADR-004-*.md`               | Decisões auth     |

---

**Congelada em:** 2026-07-31 · **Guardião:** Líder Técnico (não reabrir âmbito PRD-001 sem bug crítico).
