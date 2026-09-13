# FASE 1 — Especificação de Infraestrutura

**Documento:** Fundação técnica oficial da plataforma Kuteka  
**Versão:** 1.0  
**Estado:** **Encerrada oficialmente** (revisão técnica aprovada)  
**Código:** Fundação estável — alterações estruturais só com justificação clara  
**Âmbito:** Apenas infraestrutura — **sem funcionalidades de negócio**  
**Backlog obrigatório pré-Auth:** `docs/backlog/P0_PRE_AUTH.md`

**Referências obrigatórias:**

- Manual Operacional da Kuteka
- Software Architecture Blueprint (KEOS, Sprint 1, CDD-001)
- Design System & UX Blueprint (Nº 003)
- PASSO 0 — Identidade Oficial
- PASSO 1 + PASSO 1A — Landing (aprovados)
- `docs/AI_CONTEXT.md`

**Sequência:** Especificação → Revisão → Aprovação → Implementação → Testes → Validação

---

## 1. Objectivo da FASE 1

### 1.1 Objectivo

Entregar uma **fundação técnica sólida** onde a equipa possa construir módulos futuros com velocidade e confiança.

No final desta fase:

- existe monorepo KEOS operacional;
- existe app Next.js tipada;
- existe Design System base reutilizável;
- existe ligação preparada a Supabase/PostgreSQL;
- existem padrões de qualidade, testes, logging, erros e deploy;
- **não** existem fluxos de negócio completos (imóveis, visitas, contratos, etc.).

### 1.2 Fora de âmbito

- Landing Page implementada (só depois da infra)
- Login/registo completo de produto (FASE 2 / PRD-001) — apenas **preparação** de Auth/RBAC
- Dashboards, patrimónios, KAI funcional, pagamentos
- Apps mobile / admin separado (pastas reservadas)
- Migração de dados do protótipo Vite

### 1.3 Princípio CTO

> Devagar na arquitectura, rápido nas funcionalidades.  
> A FASE 1 é o “devagar” deliberado.

---

## 2. Arquitectura do monorepo (KEOS)

### 2.1 Nome do sistema

**KEOS — Kuteka Engineering Operating System**

### 2.2 Ferramenta de monorepo (decisão proposta)

| Opção                           | Decisão                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| **pnpm workspaces + Turborepo** | **Recomendado** — rápido, comum com Next.js, cache de builds |
| npm/yarn workspaces             | Alternativa aceitável                                        |
| Nx                              | Mais pesado para MVP — não nesta fase                        |

**ADR a criar na implementação:** `ADR-001-monorepo-tooling.md`

### 2.3 Árvore oficial (FASE 1)

```
kuteka/
├── apps/
│   ├── web/                 # Next.js App Router (produto principal)
│   ├── admin/               # Reservado (stub README only na FASE 1)
│   └── landing/             # Opcional: pode ser route group em web — ver §5
├── packages/
│   ├── ui/                  # Design System / componentes
│   ├── config/              # eslint, tsconfig, tailwind presets
│   ├── types/               # Tipos partilhados
│   ├── validation/          # Schemas (Zod) partilhados
│   ├── database/            # Clientes/helpers Supabase tipados
│   ├── auth/                # Helpers de sessão/RBAC (sem UI de negócio)
│   └── shared/              # Utils puros (dates, money Kz, ids)
├── supabase/
│   ├── migrations/          # SQL versionado
│   ├── seed/                # Seeds de desenvolvimento (roles base)
│   └── config.toml
├── docs/
│   ├── AI_CONTEXT.md
│   ├── vision/
│   ├── business/
│   ├── architecture/        # ADRs
│   ├── engineering/
│   ├── product/             # PRDs, PASSOs
│   ├── security/
│   ├── api/
│   ├── database/            # CDD
│   ├── prompts/
│   ├── playbooks/
│   ├── decisions/
│   └── glossary/
├── infrastructure/          # IaC futura (Cloudflare/Vercel notes)
├── scripts/
├── tests/                   # Testes e2e / smoke cross-app
├── tools/
├── .github/workflows/
├── package.json             # workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── .nvmrc / .node-version
├── .env.example
├── README.md
└── LICENSE (quando definido)
```

### 2.4 Decisão: `apps/web` vs `apps/landing`

**Proposta oficial FASE 1:**  
Uma única app `apps/web` com route groups:

```
app/
  (marketing)/page.tsx      # Landing futura
  (auth)/...                # FASE 2
  (app)/...                 # Shell autenticado futuro
```

`apps/landing` fica **reservado** no monorepo (README) para eventual split — evita duplicar Design System agora.

---

## 3. Organização das pastas (dentro de `apps/web`)

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (marketing)/
│   ├── (auth)/             # preparado, páginas mínimas ou placeholders
│   ├── (app)/              # preparado
│   ├── api/                # Route handlers mínimos (health)
│   ├── layout.tsx
│   └── globals.css
├── modules/                # Domínios (vazios ou stubs na FASE 1)
│   ├── authentication/
│   ├── users/
│   └── ...
├── components/             # Compostos específicos da app (não DS)
├── lib/
│   ├── supabase/
│   ├── env.ts
│   └── logger.ts
├── hooks/
├── styles/
├── public/
├── tests/
├── next.config.ts
├── tailwind.config.ts      # ou via preset @kuteka/config
├── tsconfig.json
└── package.json
```

### 3.1 Padrão por domínio (futuro — pastas criadas vazias)

```
modules/<domain>/
├── components/
├── pages/          # ou rotas re-exportadas
├── services/
├── repository/
├── hooks/
├── types/
├── validators/
└── tests/
```

**Regra:** na FASE 1, criar a estrutura e READMEs; **não** implementar regras de negócio.

---

## 4. Convenções de nomenclatura

### 4.1 Geral

| Artefacto               | Convenção                                | Exemplo                       |
| ----------------------- | ---------------------------------------- | ----------------------------- |
| Packages                | `@kuteka/<name>`                         | `@kuteka/ui`                  |
| Pastas                  | kebab-case                               | `property-photos`             |
| Componentes React       | PascalCase                               | `Button`, `KutekaScore`       |
| Funções / vars          | camelCase                                | `canApproveProperty`          |
| Tipos / Interfaces      | PascalCase                               | `UserRole`, `PropertyStatus`  |
| Constantes              | SCREAMING_SNAKE ou camel                 | `DEFAULT_LOCALE`              |
| Ficheiros de componente | PascalCase.tsx                           | `Button.tsx`                  |
| Ficheiros util          | camelCase.ts                             | `formatKz.ts`                 |
| SQL tabelas             | plural snake_case                        | `users`, `user_roles`         |
| SQL colunas             | snake_case                               | `created_at`, `property_id`   |
| Branches                | `cursor/<desc>-f96b` ou `feature/<desc>` | `feature/fase-1-infra`        |
| Commits                 | Conventional Commits                     | `chore(infra): add turborepo` |
| Env vars                | SCREAMING_SNAKE                          | `NEXT_PUBLIC_SUPABASE_URL`    |

### 4.2 IDs de produto

- Utilizador: `KID` (conceito de negócio; UUID técnico em `users.id`)
- Imóvel: `KTK-IMM-…` (FASE futura; não gerar lógica agora)

### 4.3 Proibições

`novo2.ts`, `teste.ts`, `data2`, `x`, `temp`, `foo`.

---

## 5. Estrutura do projecto Next.js

| Item      | Decisão                                                                 |
| --------- | ----------------------------------------------------------------------- |
| Versão    | Next.js 15.x (App Router) estável mais recente na data de implementação |
| Router    | **App Router only**                                                     |
| React     | 19.x conforme peer do Next                                              |
| Rendering | Server Components por defeito; Client Components só quando necessário   |
| Routing   | Route groups `(marketing)`, `(auth)`, `(app)`                           |
| Health    | `GET /api/health` → `{ status: "ok", version }`                         |
| i18n      | Preparar pasta/locale default `pt`; sem multi-idioma completo na FASE 1 |
| Imagens   | `next/image` configurado                                                |
| Fonts     | `next/font` — Inter + JetBrains Mono                                    |

### 5.1 Página mínima na FASE 1

Uma página técnica de “Foundation Ready” **ou** placeholder marketing sem conteúdo de negócio final — **não** a Landing completa até a infra estar validada.  
A implementação da Landing (PASSO 1+1A) é o **primeiro entregável visual após** a FASE 1 aprovada e construída.

---

## 6. TypeScript

| Item                       | Decisão                                 |
| -------------------------- | --------------------------------------- |
| `strict`                   | `true`                                  |
| `noUncheckedIndexedAccess` | `true` (recomendado)                    |
| `moduleResolution`         | `bundler`                               |
| Path aliases               | `@/`, `@kuteka/ui`, etc.                |
| Shared tsconfig            | `packages/config/tsconfig.base.json`    |
| Proibir                    | `any` sem justificação explícita em ADR |

Tipos de domínio partilhados vivem em `packages/types` — na FASE 1: tipos base (`User`, `Role`, `ApiError`, `Result`).

---

## 7. Tailwind CSS + Design System reutilizável

### 7.1 Tailwind

- Tailwind CSS v4 **ou** v3 estável — escolher na implementação e registar ADR.
- Preset partilhado: `packages/config/tailwind/kuteka-preset.ts`
- Tokens mapeados do Design System Nº 003:

| Token               | Valor conceptual              |
| ------------------- | ----------------------------- |
| `colors.brand`      | Kuteka Orange (primary)       |
| `colors.slate.*`    | Secondary / texto / estrutura |
| `colors.success`    | Green                         |
| `colors.warning`    | Amber                         |
| `colors.danger`     | Red                           |
| `colors.info`       | Blue                          |
| `colors.background` | White / dark slate-950        |
| `spacing`           | 4,8,12,16,24,32,48,64,96      |
| `fontFamily.sans`   | Inter                         |
| `fontFamily.mono`   | JetBrains Mono                |

### 7.2 Package `@kuteka/ui` (FASE 1 — componentes base)

Obrigatórios nesta fase (estados: default, hover, disabled, loading quando aplicável):

- Button (primary, secondary, ghost, danger)
- Input, Textarea, Label
- Checkbox, Radio (base)
- Badge, Avatar
- Card
- Spinner / Skeleton
- Alert / Toast provider stub
- Tooltip (base)
- ThemeProvider (claro/escuro)

**Não** nesta fase: mapas, calendário completo, charts, chat, timeline jurídica.

### 7.3 Tema claro / escuro

- Default: **claro**
- Dark: Slate 950
- Persistência: `localStorage` + `class` no `<html>`
- Respeitar `prefers-color-scheme` na primeira visita

### 7.4 Storybook / catálogo

**Recomendado na FASE 1:** Storybook em `packages/ui` **ou** rota interna `/dev/ui` protegida por env `NODE_ENV=development`.  
ADR na implementação.

---

## 8. Supabase + PostgreSQL

### 8.1 Papel do Supabase na FASE 1

| Serviço    | Uso na FASE 1                                                   |
| ---------- | --------------------------------------------------------------- |
| Auth       | Projecto criado; políticas base; **sem** UI de produto completa |
| PostgreSQL | Migrations iniciais de fundação                                 |
| Storage    | Bucket(s) criados vazios (`avatars`, `property-media` reserved) |
| RLS        | Activo; políticas mínimas                                       |

### 8.2 Migrations iniciais (fundação)

`supabase/migrations/0001_foundation.sql` (conceitual):

Tabelas:

- `profiles` (liga a `auth.users`)
- `roles`
- `user_roles`
- `permissions` (opcional na 0001 ou 0002)
- `role_permissions`
- `audit_logs`
- `sessions_meta` (se necessário além do Auth — avaliar; preferir Auth nativo)

Campos padrão (CDD-001):  
`id UUID PK`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`

### 8.3 Roles seed (FASE 1)

Inserir roles oficiais (sem lógica de ecrãs):

- `client`
- `patrimonial_partner`
- `certified_agent`
- `administrator`

### 8.4 Cliente TypeScript

- `packages/database` — createBrowserClient / createServerClient (SSR Next)
- Tipagem gerada: `supabase gen types` → `packages/types/database.ts`

### 8.5 Segredos

Nunca commitir service role key.  
Apenas `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` no client.

---

## 9. Autenticação base (preparação — não FASE 2)

### 9.1 O que a FASE 1 entrega

- Projecto Supabase Auth configurado
- Helpers `@kuteka/auth`: `getSession`, `getUser`, `signOut` stubs/reais técnicos
- Middleware Next preparado para rotas futuras `(app)`
- Página técnica `/dev/auth-check` **apenas em development**

### 9.2 O que fica para FASE 2 / PRD-001

- UI Login / Registo / Recuperação
- Verificação de email UX completa
- Onboarding de papéis
- Redirect inteligente pós-login

---

## 10. RBAC preparado para múltiplos papéis

### 10.1 Modelo

- **Não** usar coluna única `role` no perfil como fonte de verdade.
- Tabela `user_roles` (N:N).
- Verificação por **permissão** (`canX`), não `if role === admin` no frontend.

### 10.2 FASE 1 entregáveis

- Schema + seed de roles
- Tipos TS: `RoleCode`, `PermissionCode`
- Função servidor `userHasRole(userId, role)` / `userHasPermission(...)` (implementação mínima)
- Documentar matriz inicial de permissões (mesmo que vazia de features)

### 10.3 Matriz inicial (esqueleto)

| Permissão         | client                | patrimonial_partner | certified_agent | administrator |
| ----------------- | --------------------- | ------------------- | --------------- | ------------- |
| `platform.access` | ✓                     | ✓                   | ✓               | ✓             |
| `admin.panel`     |                       |                     |                 | ✓             |
| (restante)        | — definido nos PRDs — |                     |                 |               |

---

## 11. Gestão de ambiente

### 11.1 Ambientes

| Ambiente      | Uso               |
| ------------- | ----------------- |
| `local`       | Dev machine       |
| `development` | Preview / staging |
| `production`  | Produção          |

### 11.2 Ficheiros

- `.env.example` (completo, sem segredos)
- `.env.local` (gitignored)
- Validação com Zod em `apps/web/lib/env.ts` — **fail fast** se faltar var obrigatória

### 11.3 Variáveis mínimas FASE 1

```
NODE_ENV=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
NEXT_PUBLIC_ENABLE_DEV_TOOLS=       # true only local/dev
```

---

## 12. Logging

### 12.1 Princípios

- Logger estruturado (JSON em produção).
- Níveis: `debug`, `info`, `warn`, `error`.
- **Nunca** logar passwords, tokens, ou PII completa.
- Correlation id por request (header / middleware).

### 12.2 Implementação proposta

- `apps/web/lib/logger.ts` (pino ou console wrapper tipado).
- Em produção: integração futura com provider (ADR).
- `audit_logs` na BD para eventos de segurança (schema na FASE 1; escrita mínima).

---

## 13. Tratamento de erros

### 13.1 Modelo

- Tipo partilhado `Result<T, E>` ou erros tipados `AppError { code, message, status }`.
- Mapear erros Supabase → erros de domínio.
- UI: Error Boundary global + página `error.tsx` / `not-found.tsx` do Next.
- API: respostas JSON `{ error: { code, message } }`.

### 13.2 Códigos base FASE 1

`INTERNAL_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `SERVICE_UNAVAILABLE`

---

## 14. Sistema de configuração

- Config central em `packages/config` + `apps/web/lib/env.ts`.
- Feature flags simples via env (`NEXT_PUBLIC_FF_*`) — lista documentada.
- Sem hardcode de URLs de produção no código.

---

## 15. Estratégia de componentes

| Camada        | Onde                   | Responsabilidade                       |
| ------------- | ---------------------- | -------------------------------------- |
| Primitivos DS | `@kuteka/ui`           | Visual puro, acessível, sem negócio    |
| Compostos app | `apps/web/components`  | Combinações específicas                |
| Domínio       | `modules/*/components` | UI com significado de negócio (futuro) |

**Regras:**

- Nenhum componente gigante.
- Preferir composição.
- Sem regras de negócio no frontend (Blueprint).
- Todo primitivo com estados oficiais: loading / disabled / error quando aplicável.

---

## 16. Estratégia de testes

### 16.1 Pirâmide FASE 1

| Tipo      | Ferramenta                             | Obrigatório FASE 1                   |
| --------- | -------------------------------------- | ------------------------------------ |
| Unit      | Vitest                                 | Sim — utils, env parse, rbac helpers |
| Component | Vitest + Testing Library               | Sim — Button/Input básicos           |
| Lint/type | ESLint + `tsc`                         | Sim                                  |
| E2E       | Playwright                             | Smoke: health + home carrega         |
| SQL       | `supabase db` tests / manual checklist | Migrations aplicam limpas            |

### 16.2 Cobertura

Não obsessão de % na FASE 1; **gates**: typecheck + lint + unit críticos + smoke e2e.

---

## 17. Estratégia de deployment

| Item            | Decisão                                |
| --------------- | -------------------------------------- |
| Frontend        | **Vercel** (Blueprint)                 |
| DB/Auth/Storage | **Supabase**                           |
| DNS/CDN/WAF     | **Cloudflare** (quando domínio migrar) |
| Preview         | Deploy por PR (Vercel)                 |
| Produção        | Branch `main` protegida                |

### 17.1 CI (GitHub Actions) FASE 1

Workflow `ci.yml`:

1. Install (pnpm)
2. Lint
3. Typecheck
4. Unit tests
5. Build `apps/web`

Workflow `supabase` (opcional): validar migrations em CI com CLI.

### 17.2 Protótipo legado

`Site_Angola` (Vite/Render) **não** é alvo desta infra.  
Documentar no README: legado vs KEOS.

---

## 18. Padrões de qualidade de código

### 18.1 Tooling obrigatório

| Tool              | Uso                                            |
| ----------------- | ---------------------------------------------- |
| ESLint            | Flat config partilhada `@kuteka/config/eslint` |
| Prettier          | Formatação única                               |
| Husky             | pre-commit                                     |
| lint-staged       | eslint + prettier em staged                    |
| commitlint        | Conventional Commits (recomendado)             |
| TypeScript strict | Gate de CI                                     |

### 18.2 Regras

- Imports ordenados
- Sem `console.log` em produção (logger)
- Sem secrets no git (`gitleaks` opcional no CI)
- PR obrigatório para `main`
- Code review checklist em `docs/engineering/CODE_REVIEW.md` (criar na implementação)

---

## 19. Padrões de documentação

| Documento      | Local                        | Quando              |
| -------------- | ---------------------------- | ------------------- |
| AI_CONTEXT     | `docs/AI_CONTEXT.md`         | Já existe — manter  |
| ADR-xxx        | `docs/architecture/`         | Cada decisão infra  |
| README root    | Como correr monorepo         | FASE 1              |
| Package README | Cada `packages/*`            | FASE 1              |
| PRDs           | `docs/proposals/` (canónico) | Ex.: PRD-001 v1.0   |
| PASSOs / Specs | `docs/proposals/`            | Já em curso         |
| CDD            | `docs/database/`             | Referenciar CDD-001 |
| Prompts        | `docs/prompts/`              | Stubs na FASE 1     |

**Regra:** código sem README de package = incompleto na FASE 1.

---

## 20. Segurança (mínimos FASE 1)

- RLS activo em todas as tabelas novas
- Service role só no servidor
- Headers de segurança Next (CSP básica progressiva)
- Cookies de sessão Secure / HttpOnly (via Supabase SSR)
- Dependabot / `pnpm audit` no CI (warn na FASE 1, gate depois)
- Soft delete (`deleted_at`) conforme CDD

---

## 21. Backlog oficial de implementação (pós-aprovação)

Ordem de execução (Sprint 1):

1. Criar repositório/monorepo KEOS + pnpm + turbo
2. `packages/config` (tsconfig, eslint, prettier, tailwind preset)
3. `apps/web` Next.js + TS strict
4. `@kuteka/ui` + tema claro/escuro + tokens
5. Supabase project + `0001_foundation` migration + seeds roles
6. `@kuteka/database` + `@kuteka/auth` helpers
7. Env validation + logger + errors + health endpoint
8. Husky + lint-staged + CI GitHub Actions
9. Playwright smoke + Vitest base
10. Vercel project (dev) + `.env.example` + README
11. ADRs 001–00N
12. Validação contra Critérios de Aprovação

**Paragem:** nenhuma feature de património/cliente até FASE 1 validada.

---

## 22. Riscos e mitigações

| Risco                           | Mitigação                                                           |
| ------------------------------- | ------------------------------------------------------------------- |
| Over-engineering do monorepo    | Começar com web + ui + config + types; pastas reservadas com README |
| Supabase mal configurado        | Migration única revista + RLS desde dia 1                           |
| Implementar Landing cedo demais | Gate explícito: infra validada primeiro                             |
| Duplicar Vite legado            | README “legacy vs KEOS”; não misturar deploys                       |
| RBAC incompleto usado cedo      | FASE 1 só prepara schema/helpers; UI roles na FASE 2                |

---

## 23. Melhorias propostas (para aprovação)

1. **Route groups numa só `apps/web`** em vez de `apps/landing` separado — menos overhead.
2. **Storybook leve ou `/dev/ui`** — catálogo do DS sem custo excessivo.
3. **commitlint** — disciplina de histórico desde o início.
4. **Não migrar domínio kutekalink nesta fase** — primeiro preview Vercel; DNS depois (reduz risco operacional).

---

## 24. Critérios de Aprovação

A especificação da FASE 1 está **pronta para implementação** quando:

- [ ] O objectivo está claro: fundação técnica **sem** negócio.
- [ ] A arquitectura do monorepo KEOS está definida e alinhada ao Blueprint.
- [ ] A organização de pastas e convenções de nomenclatura estão sem ambiguidades.
- [ ] Next.js (App Router), TypeScript strict e Tailwind/DS estão especificados.
- [ ] Supabase + PostgreSQL + migrations de fundação + roles seed estão definidos.
- [ ] Auth base e RBAC multi-role estão **preparados** (não confundidos com FASE 2).
- [ ] Env, logging, erros e configuração têm padrão oficial.
- [ ] Estratégias de componentes, testes e deployment estão definidas.
- [ ] Qualidade de código (ESLint, Prettier, Husky, CI) está definida.
- [ ] Documentação (ADRs, READMEs, AI_CONTEXT) está integrada na fase.
- [ ] Existe backlog ordenado pós-aprovação.
- [ ] Este documento pode ser executado pelo Cursor **sem interpretações conflituosas**.

---

## 25. Próximo passo após aprovação

1. Aprovação formal desta especificação FASE 1.
2. **Implementação** da infraestrutura (código) seguindo o backlog §21.
3. Testes + validação dos critérios de infra.
4. Só então: implementação da **Landing Page** (PASSO 1 + 1A) sobre `apps/web`.
5. Em paralelo documental: iniciar **PRD-001 Authentication** antes da FASE 2 de código de auth de produto.

---

## 26. Pedido de aprovação

Aprova a **FASE 1 — Especificação de Infraestrutura v1.0**?

Confirme também as melhorias §23 (route groups, catálogo UI, commitlint, adiar DNS).

Após aprovação explícita, iniciaremos a **implementação técnica** — e apenas a infraestrutura.

---

_Documento oficial Kuteka — FASE 1 · Infraestrutura · Aguarda aprovação · Sem código nesta etapa._
