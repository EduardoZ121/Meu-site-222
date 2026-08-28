# ADR-004 — Authentication module (PRD-001)

**Estado:** ✅ **Accepted / N5** (módulo concluído)  
**Data:** 2026-07-31  
**Encerramento:** `docs/backlog/PRD_001_CLOSURE.md`  
**PRD:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**Autorização:** PO 2026-07-31 — implementação com P2 diferido no arranque; P2 aplicado antes do go-live  
**Contrato:** §15.5 R1–R12 · §16.5 (`activate_self_serve_roles`) · §16.6 (`next`) · content inventory

## Contexto

O módulo de autenticação é o primeiro contacto autenticado com a plataforma Kuteka. A especificação funcional foi aprovada; CI (P1) e migrations remotas (P2 + `0003`) foram aplicados; o fluxo F1–F6 → `/app` foi validado em produção (QA Review 001–002). O PO encerrou o PRD-001 sem novas rondas de polish cosmético no stub.

## Decisão

Implementar o módulo auth em `apps/web/modules/authentication` + rotas `(auth)` / `(app)`, com:

### 1. Sessão (static-export safe)

- Browser client via `@kuteka/database` com `localStorage` (`kuteka-auth`)
- Server cookie helpers mantidos para caminhos SSR futuros; `/app` usa gate cliente (`AppShell`)
- Env ausente: UI renderiza; submits devolvem erros guiados (R2), sem crash
- Runtime público: `kuteka-config.js` / `window.__KUTEKA_CONFIG__`

### 2. Allowlist `next` (R3 / §16.6)

- Função pura `resolveSafeNextPath` em `@kuteka/auth`
- Default `/app`; rejeitar absolutos, `//`, `..`, paths fora de `/app`
- `/app/admin` só com `admin.panel`; caso contrário `/app`

### 3. Gate de destino (R1)

- Ordem: sessão → email verificado → ≥1 papel → `next` seguro
- Preservar `next` ao atravessar F2 / F6 quando possível

### 4. RPC `activate_self_serve_roles` (§16.5)

- Migration `supabase/migrations/0003_activate_self_serve_roles.sql`
- Security definer; exige `auth.uid()`; só `client` / `patrimonial_partner`
- Insert idempotente em `user_roles`; audit `auth.role_activated` via `write_audit_log`
- Grant execute a `authenticated`

### 5. Content i18n-ready

- Copy centralizado em `modules/authentication/content/pt.ts` + `getAuthCopy()`
- Locale MVP `pt-AO` (D9); chaves reservadas para `en` sem UI EN no MVP
- Fonte: `docs/backlog/PRD_001_CONTENT_INVENTORY.md` + wireframes §18

### 6. Packages

- `@kuteka/validation`: `normalizeEmail`, `passwordRules`, schemas Zod auth
- `@kuteka/auth`: helpers RBAC existentes + `resolveSafeNextPath`
- UI: `@kuteka/ui` (Button, Input, Label, Checkbox, Heading, Text, Card, Badge, …)

## Consequências

- Landing CTAs apontam para `/auth/registar` e `/auth/entrar`
- Stub `/app` e `/app/admin` até Shell / módulos de negócio
- PRD-001 fechado em N5; próximos: Shell da plataforma → PRD-002
- Sem OAuth / MFA / Passaporte / KAI nesta entrega

## Fora de âmbito

- UI Passaporte / KAI / SCK
- Dashboards de negócio / Shell completo
- Alterar D1–D12 / F1–F6 sem revisão controlada do PRD
