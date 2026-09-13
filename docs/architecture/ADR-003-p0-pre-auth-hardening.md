# ADR-003 — P0 Pre-Auth Hardening (RBAC source + Audit + CI)

**Estado:** Aceite  
**Data:** 2026-07-29  
**Contexto:** Backlog `P0_PRE_AUTH` obrigatório antes do PRD-001  
**Não altera** a arquitectura base KEOS — apenas elimina bloqueios de segurança/consistência.

---

## Decisão 1 — Fonte única de RBAC = PostgreSQL

### Escolha

- Mapeamento role→permission vive só nas tabelas + seed SQL.
- RPCs `get_user_role_codes`, `get_user_permission_codes`, `user_has_permission`.
- `@kuteka/auth` avalia **permissions já resolvidas** (sem `ROLE_PERMISSIONS` embutido).
- `@kuteka/database.fetchAuthorizationContext` é o caminho de carga.

### Motivo

Eliminar drift entre TypeScript e BD (risco P0 da revisão FASE 1).

### Alternativa rejeitada

Gerar ficheiro TS a partir do seed em build — útil no futuro, mas a BD continua a ser a autoridade em runtime multi-instância.

---

## Decisão 2 — `audit_logs` só via caminho controlado

### Escolha

- Remover policy de INSERT directo para `authenticated`.
- Revogar INSERT/UPDATE/DELETE a `anon`/`authenticated`.
- Escrita apenas por `write_audit_log(...)` (`security definer`) ou `service_role`.
- Helper TS: `writeAuditLog`.

### Motivo

Impedir adulteração da trilha de auditoria por clientes autenticados.

---

## Decisão 3 — CI oficial versionado + activação em `.github/workflows/`

### Escolha

- Definição canónica em `docs/engineering/github-workflows/ci.yml`
- Activação em `.github/workflows/ci.yml` via `scripts/enable-github-ci.sh` (requer scope GitHub `workflow`)

### Motivo

Gates automáticos (lint, typecheck, test, build, e2e). Tokens sem scope `workflow` não podem criar workflows — daí o passo de activação explícito.

---

## Consequências

- PRD-001 pode consumir `fetchAuthorizationContext` + `writeAuditLog` sem reinventar RBAC/audit.
- Testes unitários usam fixtures de permissions resolvidas (simulando BD), não uma segunda matriz de produto.
