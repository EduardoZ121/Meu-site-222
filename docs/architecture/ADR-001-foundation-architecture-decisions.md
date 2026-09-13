# ADR-001 — Foundation Architecture Decisions

**Documento:** Architecture Decision Record  
**Código:** ADR-001  
**Título:** Foundation Architecture Decisions  
**Estado:** Aceite  
**Data:** 2026-07-29  
**Âmbito:** Decisões estruturais da FASE 1 — Infraestrutura (KEOS)  
**Referências:** Manual Operacional; Software Architecture Blueprint; Design System Nº 003; PASSO 0; FASE 1 Spec (aprovada); Decisões Arquiteturais Oficiais (Multi-Role, Modularidade, API First, Auditoria, Escalabilidade)

---

## Contexto

A Kuteka deixa o protótipo Vite/React + storage local e adopta a arquitectura oficial KEOS.  
Este ADR regista **o quê** foi escolhido e **porquê**, para servir de memória técnica permanente e evitar revisões estruturais frequentes.

---

## Decisão 1 — Monorepo KEOS com pnpm + Turborepo

### Escolha

- Monorepo único (`apps/`, `packages/`, `supabase/`, `docs/`)
- **pnpm** workspaces
- **Turborepo** para orquestração de `build` / `lint` / `test` / `typecheck` com cache

### Motivos

- O Blueprint define KEOS como sistema multi-app e multi-package.
- pnpm oferece instalação rápida, isolamento de dependências e suporte nativo a workspaces.
- Turborepo é leve, amplamente usado com Next.js, e evita o custo de Nx nesta fase.
- Partilha de Design System, tipos, validação e clientes de BD sem publicar packages externos.

### Alternativas rejeitadas

| Alternativa            | Motivo de rejeição                                                          |
| ---------------------- | --------------------------------------------------------------------------- |
| Repositórios separados | Duplicação de DS/tipos; sincronização frágil no MVP                         |
| npm/yarn workspaces    | Aceitáveis, mas pnpm é mais eficiente e alinhado ao ecossistema moderno     |
| Nx                     | Mais pesado para o estágio actual; pode ser reavaliado se a escala o exigir |

---

## Decisão 2 — Estrutura do monorepo

### Escolha

```
apps/web          → produto principal (Next.js)
apps/admin        → reservado (stub)
apps/landing      → reservado (stub; Landing vive em route groups de web)
packages/*        → ui, config, types, validation, database, auth, shared
supabase/         → migrations, seed, config
legacy/           → protótipo Vite isolado (não é base de produção)
docs/             → visão, ADRs, specs, AI_CONTEXT
```

### Motivos

- Separação clara entre produto, bibliotecas partilhadas e infraestrutura de dados.
- Pastas reservadas evitam refactor destrutivo quando admin ou landing split forem necessários.
- `legacy/` documenta e isola o protótipo sem misturar deploys nem dependências.

---

## Decisão 3 — Landing integrada em `apps/web` (Route Groups)

### Escolha

Uma única app `apps/web` com:

```
app/(marketing)/   # Landing futura
app/(auth)/        # FASE 2
app/(app)/         # Shell autenticado futuro
```

### Motivos

- Partilha imediata do Design System, fonts, tema e config.
- Menos overhead operacional (um projecto Vercel, um pipeline).
- Split futuro para `apps/landing` continua possível sem alterar a arquitectura principal.

### Alternativa rejeitada

App `apps/landing` separada agora — duplicação prematura de tooling e DS.

---

## Decisão 4 — Next.js App Router

### Escolha

Next.js 15.x com **App Router only** (sem Pages Router).

### Motivos

- Stack oficial aprovada (Blueprint + AI_CONTEXT).
- Server Components por defeito → menos JS no cliente, melhor performance e SEO para marketing.
- Route Handlers para API First (`/api/*`).
- Integração madura com Vercel e Supabase SSR.
- Middleware nativo para auth/guards futuros.

### Alternativas rejeitadas

| Alternativa                  | Motivo                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Vite SPA (legado)            | Sem SSR/SEO nativo adequado; não é a arquitectura oficial    |
| Pages Router                 | Modelo legado do Next; App Router é o caminho de longo prazo |
| Remix / outro meta-framework | Fora do Blueprint oficial                                    |

---

## Decisão 5 — Server Components por defeito

### Escolha

React Server Components (RSC) como default; Client Components (`"use client"`) apenas quando necessário (interacção, estado local, browser APIs).

### Motivos

- Reduz surface de hidratação e melhora TTFB/LCP na Landing e páginas de leitura.
- Alinha com API First: dados sensíveis e autorização ficam no servidor.
- Facilita auditoria e logging no servidor sem expor lógica no browser.

---

## Decisão 6 — TypeScript strict

### Escolha

TypeScript com `strict: true` e `noUncheckedIndexedAccess: true`. Packages partilhados tipados (`@kuteka/types`).

### Motivos

- Contratos explícitos entre módulos (API First + modularidade).
- Falhas de tipo no CI antes de produção.
- Longevidade: refactors seguros à medida que novos papéis e módulos entram.

---

## Decisão 7 — Tailwind CSS + Design System em `@kuteka/ui`

### Escolha

- Tailwind CSS v3.4 (estável) com preset partilhado `@kuteka/config`
- Tokens do Design System Nº 003: **Kuteka Orange** (primary), Slate (secondary), Inter + JetBrains Mono
- Componentes primitivos em `@kuteka/ui`
- Catálogo oficial em `/dev/ui` (development) — equivalente leve a Storybook

### Motivos

- Tailwind mapeia directamente a escala de spacing 4–96 e tokens de cor.
- v3.4 é maduro no ecossistema monorepo/Next; v4 pode ser adoptado depois sem mudar a arquitectura de packages.
- `@kuteka/ui` sem regras de negócio permite reutilização em web, admin e futuros clients.
- `/dev/ui` entrega catálogo sem o custo de Storybook nesta fase; Storybook pode ser adicionado se a equipa o exigir.

### Primary oficial

**Kuteka Orange** = `#EA580C` (escala `brand.50`–`brand.950` no preset). Verde reservado a estados de sucesso — não é cor de marca.

---

## Decisão 8 — Supabase + PostgreSQL

### Escolha

- **PostgreSQL** como base de dados oficial
- **Supabase** para Auth, PostgreSQL hosted, Storage e RLS
- Migrations SQL versionadas em `supabase/migrations/`

### Motivos

- Alinhado ao Blueprint e ao objectivo de auditoria + RLS desde o dia 1.
- Auth gerido com sessão SSR compatível com Next.js.
- Storage para avatars / media de património sem reinventar object storage.
- PostgreSQL é o standard relacional de longa duração para PropTech (contratos, papéis, auditoria).

### Alternativas rejeitadas

| Alternativa      | Motivo                                                              |
| ---------------- | ------------------------------------------------------------------- |
| MongoDB (legado) | Não modela bem RBAC relacional, auditoria e integridade referencial |
| Firebase         | Menos alinhado a SQL/RLS e ao Blueprint                             |
| Auth caseiro     | Risco de segurança; custo de manutenção elevado                     |

---

## Decisão 9 — Estratégia de migrações

### Escolha

- SQL versionado (`0001_foundation.sql`, …) aplicado via Supabase CLI
- Soft delete (`deleted_at`) e timestamps padrão (CDD-001)
- Seeds de roles em ficheiro separado / secção de seed
- RLS activo em todas as tabelas de domínio desde a primeira migration

### Motivos

- Histórico reproduzível em local, staging e produção.
- Evita drift de schema entre ambientes.
- Auditoria e multi-role exigem schema relacional explícito desde o início.

---

## Decisão 10 — Modelo Multi-Role + RBAC por capacidades

### Escolha

- Identidade principal: **Utilizador** (`auth.users` + `profiles`)
- Papéis: atribuições N:N via `user_roles` (nunca coluna única `role` como fonte de verdade)
- Autorização por **permissões/capacidades** (`permissions`, `role_permissions`)
- Roles seed iniciais: `client`, `patrimonial_partner`, `certified_agent`, `administrator`
- Arquitectura aberta a novos papéis (Avaliador, Advogado, Notário, Investidor, etc.) sem mudar o modelo

### Motivos

- Decisão arquitectural oficial: uma conta, vários papéis.
- Evita `if (role === 'admin')` no frontend; usa `can(permission)`.
- Longevidade: novos papéis = novos rows + permissions, não refactor estrutural.

---

## Decisão 11 — Modularidade por domínio

### Escolha

Pastas `apps/web/modules/<domain>/` (authentication, users, patrimónios, contratos, wallet, …) com estrutura padrão (components, services, repository, hooks, types, validators, tests).

### Motivos

- Cada domínio evolui com impacto controlado nos restantes.
- Preparação para Clean Architecture / Repository Pattern sem over-engineering na FASE 1 (stubs + README).

---

## Decisão 12 — API First

### Escolha

- Contratos tipados e Route Handlers (`/api/health` na FASE 1)
- Packages `@kuteka/types` + `@kuteka/validation` (Zod) como fonte de contratos
- Sem acoplar UI a detalhes de persistência

### Motivos

- Facilita apps móveis, integrações e novos serviços.
- Validação partilhada cliente/servidor.

---

## Decisão 13 — Auditabilidade

### Escolha

Tabela `audit_logs` na migration de fundação; logger estruturado na app; regra: acções importantes devem ser auditáveis.

### Motivos

- PropTech de confiança exige histórico de operações.
- Segurança e conformidade futuras dependem desta base desde o dia 1.

---

## Decisão 14 — Qualidade: Conventional Commits + Commitlint + CI

### Escolha

ESLint, Prettier, Husky, lint-staged, **commitlint** (Conventional Commits), GitHub Actions (`lint`, `typecheck`, `test`, `build`).

### Motivos

- Histórico legível e automatizável (changelog, scopes).
- Gates objectivos antes de `main`.
- Disciplina desde a fundação reduz dívida técnica.

---

## Decisão 15 — Deploy e DNS

### Escolha

- Deploy alvo: **Vercel** (`apps/web`) + Supabase
- Cloudflare para DNS/CDN/WAF quando o domínio migrar
- **Adiar alterações de DNS** de kutekalink.com até a infra estar estável e validada

### Motivos

- Reduz risco operacional durante a fundação.
- Preview por PR permite validação sem afectar o site actual (Render/legado).

---

## Decisão 16 — Protótipo Vite em `legacy/`

### Escolha

O código Vite/React actual move-se para `legacy/` e deixa de ser a base de produção.

### Motivos

- Preserva histórico e referência de UX experimental.
- Impede mistura acidental de stacks no deploy e no CI principal.

---

## Consequências

### Positivas

- Fundação alinhada ao Blueprint e às decisões oficiais Multi-Role / Modularidade / API First / Auditoria.
- Equipa futura compreende o “porquê” sem arqueologia de PRs.
- Crescimento de papéis e módulos sem alterar a arquitectura principal.

### Trade-offs aceites

- Curva inicial de monorepo + packages (compensada pela velocidade nas fases seguintes).
- Storybook completo adiado a favor de `/dev/ui`.
- Auth de produto (UI) fica para FASE 2 / PRD-001 — apenas preparação técnica agora.

### Regra pós-ADR

Alterações estruturais só com benefício significativo em qualidade, segurança, escalabilidade ou manutenção — e preferencialmente via novo ADR.

---

## Estado de implementação

Este ADR é implementado pela **FASE 1 — Infraestrutura** no monorepo KEOS.
