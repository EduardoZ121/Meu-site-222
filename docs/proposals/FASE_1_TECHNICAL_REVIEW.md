# FASE 1 — Revisão Técnica da Infraestrutura

**Documento:** Validação crítica da implementação vs especificação aprovada  
**Código:** `FASE_1_TECHNICAL_REVIEW`  
**Versão:** 1.0  
**Data:** 2026-07-29  
**Branch revista:** `cursor/fase-1-infraestrutura-f96b`  
**PR:** https://github.com/EduardoZ121/Site_Angola/pull/1  
**Referências:**  
`docs/proposals/FASE_1_INFRAESTRUTURA_SPEC.md` · `docs/architecture/ADR-001-foundation-architecture-decisions.md` · `docs/AI_CONTEXT.md` · Decisões Arquiteturais Oficiais (Multi-Role, Modularidade, API First, Auditoria, Escalabilidade)

**Objectivo deste documento:** confirmar conformidade **e** expor riscos reais da fundação — não emitir um “tudo OK” acrítico.

**Decisão oficial (pós-revisão):** FASE 1 **encerrada**. Landing autorizada. Riscos P0 → `docs/backlog/P0_PRE_AUTH.md` (bloqueiam PRD-001).

---

## Veredicto executivo

A FASE 1 entrega uma **fundação KEOS utilizável e alinhada** com a especificação aprovada: monorepo, Next.js App Router, Design System, schema Multi-Role/RBAC, qualidade local e isolamento do legado.

A infraestrutura está **pronta para a implementação da Landing Page**.

Contudo, existem **riscos estruturais que não bloqueiam a Landing**, mas **devem ser corrigidos antes da FASE 2 (Auth de produto)** — em especial a **dupla fonte de verdade do RBAC**, a **política de insert em `audit_logs`**, a **activação do CI no GitHub Actions**, e o **wiring real de sessão Supabase**.

| Dimensão            | Estado                          | Nota                                                               |
| ------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Conformidade à spec | **Sólida com gaps controlados** | Gaps maioritariamente adiados de forma consciente ou de preparação |
| Arquitectura        | **Aprovada com ressalvas**      | Modelo correcto; runtime Auth/RBAC ainda é esqueleto               |
| Qualidade           | **Aprovada localmente**         | Gates locais verdes; CI ainda não enforce no GitHub                |
| Segurança           | **Preparada, não endurecida**   | Schema/RLS bons; políticas e headers incompletos                   |
| Escalabilidade      | **Aprovada na direcção**        | Extensível por desenho; packages ainda acoplados ao Next           |
| Landing             | **Autorizada a avançar**        | Não depende dos gaps de Auth/CI                                    |

---

## 1. Conformidade

### 1.1 Comparação especificação → implementação

| Área da spec                                         | Esperado                         | Implementado                                                                                                                                  | Estado                   |
| ---------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Monorepo pnpm + Turborepo                            | Sim                              | Sim                                                                                                                                           | ✅ Completo              |
| Árvore `apps/` / `packages/` / `supabase/` / `docs/` | Sim                              | Sim (+ `legacy/`)                                                                                                                             | ✅ Completo              |
| `apps/admin`, `apps/landing` reservados              | README stubs                     | Sim                                                                                                                                           | ✅ Completo              |
| Landing em route groups `(marketing)`                | Sim (melhoria aprovada)          | Sim                                                                                                                                           | ✅ Completo              |
| Next.js 15 App Router + React 19                     | Sim                              | Sim (15.5.x)                                                                                                                                  | ✅ Completo              |
| TypeScript strict + `noUncheckedIndexedAccess`       | Sim                              | Sim (base config)                                                                                                                             | ✅ Completo              |
| Tailwind + tokens Orange/Slate                       | Sim                              | Tailwind **v3.4** + preset                                                                                                                    | ✅ Completo (ADR)        |
| `@kuteka/ui` primitivos FASE 1                       | Lista obrigatória                | Button, Input, Textarea, Label, Checkbox, Radio, Badge, Avatar, Card, Spinner/Skeleton, Alert, Toast stub, Tooltip, ThemeProvider, Typography | ✅ Completo              |
| Catálogo DS `/dev/ui` ou Storybook                   | Um dos dois                      | `/dev/ui`                                                                                                                                     | ✅ Completo              |
| Tema claro/escuro                                    | Sim                              | `ThemeProvider` + `localStorage` + `prefers-color-scheme`                                                                                     | ✅ Completo              |
| Supabase migrations foundation                       | `0001` + roles/permissions/audit | Sim + RLS + buckets                                                                                                                           | ✅ Completo (SQL)        |
| Seeds roles oficiais                                 | 4 roles                          | `client`, `patrimonial_partner`, `certified_agent`, `administrator`                                                                           | ✅ Completo              |
| `@kuteka/database` clients                           | browser/server/service           | Sim                                                                                                                                           | ✅ Completo              |
| `@kuteka/auth` RBAC helpers                          | `userHasRole` / permission       | Sim (+ matriz em TS)                                                                                                                          | ⚠️ Parcial               |
| `getSession` / `getUser` / `signOut`                 | Spec §9.1                        | **Não** como API nomeada; clients existem, sessão não wired                                                                                   | ⚠️ Parcial               |
| Middleware preparado                                 | Sim                              | Correlation id + bloqueio `/dev` em prod                                                                                                      | ⚠️ Parcial               |
| `/api/health`                                        | Sim                              | Sim                                                                                                                                           | ✅ Completo              |
| Env Zod + `.env.example`                             | Fail fast                        | Zod presente; **Supabase opcional**                                                                                                           | ⚠️ Parcial (intencional) |
| Logger estruturado                                   | Sim                              | JSON logger + redaction básica                                                                                                                | ✅ Completo              |
| Erros tipados + `error.tsx`                          | Sim                              | `AppError`, boundaries                                                                                                                        | ✅ Completo              |
| Modules domain stubs                                 | Sim                              | 11 módulos com README + pastas                                                                                                                | ✅ Completo              |
| Vitest + Playwright smoke                            | Sim                              | Sim                                                                                                                                           | ✅ Completo              |
| Husky + commitlint                                   | Sim                              | Sim                                                                                                                                           | ✅ Completo              |
| CI GitHub Actions                                    | `ci.yml` em `.github/workflows`  | Template em `docs/engineering/github-workflows/`                                                                                              | ⚠️ Parcial / adiado      |
| Projecto Supabase remoto criado                      | Spec §8                          | **Não verificado nesta sessão** — só SQL/CLI config                                                                                           | ⚠️ Adiado operacional    |
| Projecto Vercel                                      | Spec §17 / backlog               | `apps/web/vercel.json` apenas                                                                                                                 | ⚠️ Adiado operacional    |
| ADR-001                                              | Sim                              | Documento unificado de fundação                                                                                                               | ✅ Completo              |
| Headers CSP progressivos                             | Spec §20                         | **Não** implementados                                                                                                                         | ⚠️ Adiado                |
| Tipos gerados Supabase                               | Spec §8.4                        | **Não** (`database.ts` gerado ausente)                                                                                                        | ⚠️ Adiado                |
| i18n pasta/`pt`                                      | Preparar                         | `lang="pt"` no layout; **sem** pasta `locales/`                                                                                               | ⚠️ Parcial mínima        |
| `pnpm audit` / Dependabot no CI                      | Warn                             | Não no pipeline activo                                                                                                                        | ❌ Não                   |
| LICENSE                                              | Quando definido                  | Ausente                                                                                                                                       | Adiado (não bloqueante)  |
| Protótipo Vite isolado                               | Sim                              | `legacy/`                                                                                                                                     | ✅ Completo              |
| DNS kutekalink                                       | Adiar (aprovado)                 | Não alterado                                                                                                                                  | ✅ Adiado correcto       |

### 1.2 Itens totalmente implementados

- Estrutura KEOS (apps, packages, supabase, docs, infrastructure stub, scripts)
- App Next tipada com route groups e página “Foundation Ready”
- Design System base + catálogo `/dev/ui`
- Schema SQL Multi-Role + permissions + audit + soft delete + trigger de profile
- Packages de contratos (`types`, `validation`), dados (`database`), utils (`shared`), config
- Tooling local de qualidade (ESLint, Prettier, Husky, commitlint, Vitest, Playwright)
- Documentação ADR-001, READMEs de package, AI_CONTEXT actualizado, notas de implementação

### 1.3 Itens parcialmente implementados

| Item                   | O que falta                                                | Justificação / impacto                                                                   |
| ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Auth helpers de sessão | `getSession`/`getUser`/`signOut` + refresh no middleware   | Spec permite preparação; **obrigatório na FASE 2** antes de UI auth                      |
| RBAC runtime           | Matriz **duplicada** em TS (`ROLE_PERMISSIONS`) vs BD      | Útil para testes unitários agora; **risco de drift** (ver §6)                            |
| Middleware de rotas    | Sem guard de `(app)` nem refresh Supabase SSR              | Correcto sem produto auth; insuficiente para produção autenticada                        |
| Env fail-fast          | Chaves Supabase opcionais                                  | Permite build/Landing sem projecto Supabase; em produção Auth deve tornar-se obrigatório |
| CI                     | Ficheiro existe como template, não em `.github/workflows/` | Limitação de scope `workflow` do token; **gates não enforced no GitHub**                 |
| i18n                   | Só `lang="pt"`                                             | Aceitável FASE 1; falta estrutura `locales/` se multi-idioma vier cedo                   |
| Segurança HTTP         | Sem CSP / security headers Next                            | Spec pedia CSP “progressiva”; ainda não iniciada                                         |

### 1.4 Itens adiados (conscientes ou operacionais)

| Item                           | Motivo                              | Quando tratar                       |
| ------------------------------ | ----------------------------------- | ----------------------------------- |
| Landing Page                   | Gate explícito pós-revisão          | Após aprovação deste review         |
| Auth UI / onboarding papéis    | FASE 2 / PRD-001                    | Próxima fase de produto             |
| DNS / Cloudflare no domínio    | Melhoria aprovada                   | Após infra estável + preview Vercel |
| Storybook completo             | `/dev/ui` aprovado como equivalente | Opcional quando o DS crescer        |
| Tipos SQL gerados              | Requer projecto Supabase ligado     | Ao provisionar Supabase             |
| Dependabot / `pnpm audit` gate | Warn na spec                        | Ao activar CI                       |
| Domínios de negócio            | Fora de âmbito                      | PRDs futuros                        |
| App mobile / admin real        | Pastas reservadas                   | Depois da web madura                |

### 1.5 Diferenças relevantes vs naming da spec

- Spec mencionava ADR `ADR-001-monorepo-tooling.md`; implementou-se **ADR-001 unificado** de fundação (mais completo) — aceitável e preferível.
- E2E vive em `apps/web/tests/e2e` (não em `/tests` root, que está vazio) — funcionalmente equivalente.
- CI fora de `.github/workflows` — **desvio operacional**, não de arquitectura.

---

## 2. Arquitectura

### 2.1 Estrutura final do monorepo

```
kuteka/
├── apps/
│   ├── web/                 # Produto (Next.js)
│   ├── admin/               # Stub
│   └── landing/             # Stub (Landing = (marketing) em web)
├── packages/
│   ├── config | ui | types | validation | database | auth | shared
├── supabase/                # migrations + seed + config.toml
├── docs/                    # AI_CONTEXT, ADR, proposals, engineering…
├── legacy/                  # Vite prototype isolado
├── infrastructure/          # Stub IaC
├── scripts/
├── tests/                   # Reservado (e2e actual em apps/web)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 2.2 Organização das aplicações

| App            | Papel FASE 1                                                                |
| -------------- | --------------------------------------------------------------------------- |
| `apps/web`     | Única app executável: marketing foundation, health, dev tools, módulos stub |
| `apps/admin`   | Reservado                                                                   |
| `apps/landing` | Reservado (split futuro possível sem refactor do modelo)                    |

Route groups em `apps/web`:

- `(marketing)` — foundation (Landing a seguir)
- `(auth)` — placeholder FASE 2
- `(app)` — placeholder shell autenticado

### 2.3 Organização dos packages

| Package              | Responsabilidade                 | Acoplamento                  |
| -------------------- | -------------------------------- | ---------------------------- |
| `@kuteka/config`     | TS / ESLint / Tailwind presets   | Tooling                      |
| `@kuteka/ui`         | Primitivos DS, sem negócio       | React peer                   |
| `@kuteka/types`      | Contratos partilhados            | Nenhum runtime               |
| `@kuteka/validation` | Zod schemas                      | zod                          |
| `@kuteka/shared`     | `cn`, `formatKz`, Result helpers | clsx/twMerge                 |
| `@kuteka/database`   | Clientes Supabase                | `@supabase/*`, Next opcional |
| `@kuteka/auth`       | RBAC puro (funções)              | `@kuteka/types`              |

### 2.4 Dependências entre módulos (apps/web)

```
apps/web
  → @kuteka/ui, auth, database, types, validation, shared
packages/ui → shared
packages/auth → types
packages/validation → (zod)
packages/database → supabase-js/ssr
```

Os `modules/*` ainda **não** têm dependências de código (stubs). Isto está correcto para FASE 1, mas a disciplina de fronteiras (services/repository) só será testada quando o primeiro domínio real entrar.

### 2.5 Fluxo de autenticação preparado

**Estado actual (honesto):**

1. Clientes Supabase browser/server/service-role existem.
2. `/dev/auth-check` reporta se env público está configurado.
3. Middleware **não** refresca sessão nem bloqueia `(app)`.
4. Não há `getSession` / `getUser` / `signOut` exportados como API de produto.

**Conclusão:** a **plataforma de Auth está preparada ao nível de clientes e schema**, não ao nível de **fluxo de sessão**. Adequado à FASE 1; insuficiente para FASE 2 sem trabalho dedicado.

### 2.6 Fluxo Multi-Role

Modelo implementado (correcto e alinhado às decisões oficiais):

- Identidade = `auth.users` + `profiles`
- Papéis = tabela `roles` (extensível por rows, não por enum fechado de produto)
- Atribuição = `user_roles` (N:N, uma conta / vários papéis)
- Capacidades = `permissions` + `role_permissions`

Seeds cobrem os 4 papéis oficiais activos. Papéis futuros (Avaliador, Advogado, etc.) **cabem no modelo** sem alterar tabelas — falta apenas inserir roles/permissions nos PRDs.

### 2.7 Estrutura RBAC

```
User ──< user_roles >── Role ──< role_permissions >── Permission
                              │
                         (capabilities)
```

Helpers TS: `userHasRole`, `userHasPermission`, `canAccessAdminPanel`, etc.

**Ponto crítico:** a matriz `ROLE_PERMISSIONS` em `@kuteka/auth` é um **espelho estático** do seed SQL. Em runtime de produto, a fonte de verdade **deve ser a BD** (ou código gerado a partir da BD). Manter ambas sem sincronização automática é a maior ameaça de consistência desta fundação.

### 2.8 Estratégia das migrations

- SQL versionado em `supabase/migrations/0001_foundation.sql`
- Seeds em `supabase/seed/0001_roles.sql`
- RLS activo nas tabelas de domínio
- Soft delete + `updated_at` triggers
- Auto-profile on signup (`handle_new_user`)
- Buckets `avatars` / `property-media` reservados

**Lacunas:**  
não há evidência nesta revisão de `supabase db reset` / apply remoto bem-sucedido; faltam políticas RLS de Storage; faltam policies de administração para gestão de `user_roles` (hoje só leitura “own” + service role).

---

## 3. Qualidade

Estado verificado no ambiente de implementação (branch FASE 1):

| Gate       | Ferramenta               | Estado      | Evidência / nota                                       |
| ---------- | ------------------------ | ----------- | ------------------------------------------------------ |
| Lint       | ESLint (packages + web)  | ✅ Pass     | `pnpm lint`                                            |
| TypeScript | `tsc --noEmit` via turbo | ✅ Pass     | `pnpm typecheck`                                       |
| Build      | `next build`             | ✅ Pass     | `@kuteka/web`                                          |
| Unit       | Vitest                   | ✅ Pass     | auth, shared, validation, ui, web errors               |
| E2E smoke  | Playwright               | ✅ Pass     | `/` + `/api/health`                                    |
| Husky      | pre-commit + commit-msg  | ✅ Presente | lint-staged (Prettier) + commitlint                    |
| Commitlint | Conventional Commits     | ✅ Presente | `commitlint.config.cjs`                                |
| Vitest     | Configurado              | ✅          | packages + web                                         |
| Playwright | Configurado              | ✅          | smoke mínimo adequado FASE 1                           |
| CI GitHub  | Workflow activo          | ⚠️ Não      | Template em `docs/engineering/github-workflows/ci.yml` |

### 3.1 Leitura crítica da qualidade

- A pirâmide FASE 1 está **cumprida no essencial**.
- Cobertura é **rasa por desenho** (correcto), mas RBAC **ainda não** tem testes de integração contra SQL.
- Pre-commit formatta com Prettier; ESLint no staged foi simplificado (evita ENOENT no root) — o gate forte de lint está no comando `pnpm lint` / CI futuro, não em cada commit.
- Enquanto o CI não estiver em `.github/workflows`, **main pode receber regressões sem gate automático**.

---

## 4. Segurança

### 4.1 Preparado

| Requisito               | Avaliação                                                    |
| ----------------------- | ------------------------------------------------------------ |
| Gestão de permissões    | Schema + seed + helpers por capability — **modelo correcto** |
| Isolamento entre papéis | `user_roles` N:N + RLS select own — **base correcta**        |
| Auditoria               | Tabela `audit_logs` + logger app — **schema pronto**         |
| Variáveis de ambiente   | `.env.example`, gitignore, service role só server — **bom**  |
| Protecção de rotas      | `/dev/*` bloqueado em produção (salvo flag) — **mínimo**     |

### 4.2 Não endurecido / riscos

1. **`audit_logs` INSERT para `authenticated` com `actor_id = auth.uid()`**  
   Permite a um utilizador escrever eventos de auditoria arbitrários em seu nome.  
   **Recomendação:** remover insert directo do cliente; usar função `security definer` ou service role.

2. **Buckets Storage sem policies explícitas**  
   Reservados, mas sem RLS de storage documentada/aplicada nesta fase.  
   **Recomendação:** migration `0002_storage_policies` antes de qualquer upload.

3. **Sem CSP / security headers**  
   Spec pedia início progressivo.  
   **Recomendação:** headers base no Next antes de produção pública autenticada.

4. **Middleware sem sessão**  
   Não há protecção real de `(app)`. Aceitável agora; perigoso se alguém começar a pôr páginas autenticadas sem FASE 2.

5. **RBAC em TS pode divergir da BD**  
   Um admin “na BD” sem update do mapa TS (ou o inverso) cria falsos positivos/negativos de autorização no app layer.

6. **Deploy legado**  
   `.github/workflows/deploy.yml` do Vite permanece no histórico do repo. Risco operacional de deploy errado se alguém o disparar após merge — deve ser desactivado explicitamente quando Vercel for o alvo.

### 4.3 Conclusão de segurança

A fundação está **orientada para segurança** (RLS desde dia 1, sem service role no client, soft delete, audit table).  
**Não** está ainda numa postura “production-hardened” para Auth.  
Para Landing pública estática/marketing: **aceitável**.  
Para contas reais: **corrigir os pontos 1–5 antes ou no início da FASE 2**.

---

## 5. Escalabilidade

| Cenário                     | Preparada?           | Comentário                                                                                     |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| Crescimento de utilizadores | ✅ Direcção correcta | Postgres + Supabase Auth; índices base em `user_roles` / `audit_logs`                          |
| Novos módulos               | ✅                   | Pastas `modules/*` + packages partilhados                                                      |
| Novos papéis                | ✅                   | Insert em `roles`/`permissions` — sem mudar arquitectura                                       |
| Apps móveis                 | ⚠️ Parcial           | API First iniciado; packages ainda consumidos via transpile Next (sem build library publicado) |
| APIs externas               | ✅ Caminho           | Route Handlers + Zod + tipos; falta versionamento/OpenAPI mais tarde                           |
| Novos serviços              | ✅                   | Monorepo permite `apps/*` adicionais                                                           |

### 5.1 Limites de escala a monitorizar

- `audit_logs` crescerá rápido — planear retenção/particionamento noutro ADR quando o volume aparecer.
- Matriz de permissões em memória (TS) não escala como sistema de autorização de produção.
- Turborepo actual não publica artefacts de packages; mobile/outro runtime precisará de estratégia de build (`tsup`/`unbuild`) ou app BFF.

---

## 6. Dívida Técnica

### 6.1 Limitações actuais

1. Dupla fonte de verdade RBAC (SQL seed ↔ `ROLE_PERMISSIONS`).
2. Sessão Auth não wired (sem refresh middleware).
3. CI não activo no GitHub Actions.
4. Sem tipos gerados da BD.
5. Sem políticas Storage.
6. Sem CSP.
7. Env Supabase opcional (bom para Landing; frágil se alguém “forçar” Auth cedo).
8. `/tests` root vazio; e2e só na app web.
9. Packages sem `build` independente.
10. Projecto Supabase/Vercel não provisionados nesta revisão.

### 6.2 Riscos conhecidos (priorizados)

| Prioridade                       | Risco                        | Impacto se ignorado                |
| -------------------------------- | ---------------------------- | ---------------------------------- |
| **P0 (antes FASE 2)**            | Drift RBAC TS/BD             | Autorização incorrecta em produção |
| **P0 (antes FASE 2)**            | Insert livre em `audit_logs` | Auditoria não confiável            |
| **P0 (antes merge operacional)** | CI inactivo                  | Regressões silenciosas em `main`   |
| **P1**                           | Storage sem policies         | Uploads inseguros ou bloqueados    |
| **P1**                           | Middleware sem sessão        | Páginas “auth” falsamente expostas |
| **P2**                           | Sem CSP                      | Superfície XSS maior na evolução   |
| **P2**                           | Deploy legado activo no repo | Deploy para stack errada           |
| **P3**                           | Sem OpenAPI/versionamento    | Integrações futuras mais lentas    |

### 6.3 Melhorias futuras recomendadas (não bloqueiam Landing)

1. Fonte única de permissões: gerar mapa TS a partir da BD **ou** carregar permissions na sessão a partir de SQL.
2. Helpers reais: `getSession`, `getUser`, `signOut`, `requirePermission` (server).
3. Activar `docs/engineering/github-workflows/ci.yml` → `.github/workflows/ci.yml`.
4. Migration `0002` storage policies + (opcional) revoke audit insert client-side.
5. `supabase gen types` → `packages/types/database.ts`.
6. Security headers no `next.config.ts`.
7. Desactivar workflow de deploy Vite legado.
8. Estrutura `locales/pt` mínima quando a Landing multi-idioma for necessária.
9. Quando o primeiro domínio nascer: impor boundary repository/service com teste de arquitectura simples.

### 6.4 Decisões a rever quando a plataforma crescer

| Decisão actual                  | Rever quando…                                                   |
| ------------------------------- | --------------------------------------------------------------- |
| `/dev/ui` em vez de Storybook   | O DS tiver > ~30 componentes / design QA formal                 |
| Tailwind v3                     | Tailwind v4 estabilizar no monorepo Next da equipa              |
| Uma app `web` com marketing+app | SEO/edge/team ownership justificar `apps/landing`               |
| RBAC helpers in-process         | Surge necessidade de autorização partilhada por vários serviços |
| Logger console JSON             | Volume/prod exigir provider (Datadog, etc.) — novo ADR          |
| Soft delete global              | Compliance exigir hard delete / retention policies por domínio  |

---

## 7. Análise crítica — o que poderia comprometer o futuro

### 7.1 O que está bem feito (manter)

- Separar **Utilizador** de **Papéis** desde a migration 0001.
- Autorizar por **permissão**, não por `if (role === 'admin')` no UI.
- Isolar o Vite em `legacy/` em vez de “evoluir o protótipo”.
- Colocar o DS em package sem regras de negócio.
- ADR-001 como memória permanente — reduz discussões cíclicas.

### 7.2 O que corrigiria agora se Auth viesse já a seguir

Se a Landing fosse acompanhada imediatamente de login real, **não** consideraria a FASE 1 fechada sem:

1. eliminar/neutralizar a dupla matriz RBAC;
2. fechar inserts de auditoria;
3. wiring de sessão no middleware;
4. CI activo.

Como a sequência oficial é **Landing → depois PRD-001 Auth**, estes itens podem ser o **primeiro backlog técnico da FASE 2**, desde que **não** se construam fluxos autenticados por cima do esqueleto actual.

### 7.3 Julgamento CTO

A fundação **não está perfeita**, mas está **disciplinada**.  
Os gaps encontrados são sobretudo de **endurecimento e runtime Auth**, não de **erro de modelo**.  
O modelo Multi-Role/modular/API-first está no sítio certo para a Kuteka crescer décadas — desde que a equipa resista a atalhos (`role` único no profile, permissões só no frontend, auditoria cosmética).

---

## 8. Checklist Final

| Critério                               | Resultado                                     | Comentário                                    |
| -------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| Infraestrutura aprovada                | **SIM** (com backlog P0 para FASE 2)          | Spec cumprida no essencial                    |
| Arquitectura aprovada                  | **SIM** (com ressalvas RBAC runtime)          | Modelo oficial correcto                       |
| Qualidade aprovada                     | **SIM** (local) / **CONDICIONAL** (CI remoto) | Activar workflow GitHub                       |
| Segurança aprovada                     | **CONDICIONAL**                               | Adequada à Landing; endurecer antes de Auth   |
| Escalabilidade aprovada                | **SIM**                                       | Direcção correcta; limites documentados       |
| Pronta para desenvolvimento da Landing | **SIM**                                       | Autorizado a avançar após aceite deste review |

### Recomendação formal

**Propor o encerramento oficial da FASE 1 — Infraestrutura**, com as seguintes condições explícitas:

1. Landing Page (PASSO 1 + 1A) pode iniciar sobre `apps/web/(marketing)`.
2. Nenhum fluxo autenticado de produto até PRD-001 + correcções P0 (§6.2).
3. Activar CI em `.github/workflows/` na primeira oportunidade com token `workflow`.
4. Tratar os itens P0 como pré-requisitos da FASE 2, não como “nice to have”.

---

## 9. Pedido de decisão

Aprova o **encerramento da FASE 1** com base nesta revisão técnica?

Se sim, o próximo passo oficial é a **implementação da Landing Page** (PASSO 1 + PASSO 1A), sem alterar a arquitectura base excepto benefícios significativos (regra já definida).

---

_Documento oficial Kuteka — FASE 1 · Revisão Técnica · Análise crítica · Aguarda decisão de encerramento_
