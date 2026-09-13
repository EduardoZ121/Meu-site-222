# ADR-005 — Platform Shell (Fase 3)

**Estado:** ✅ Accepted  
**Data:** 2026-07-31  
**Spec:** `docs/proposals/PHASE_3_PLATFORM_SHELL_SPEC.md` v0.9 (Aprovação Funcional + §12)  
**Baseline:** `docs/PROJECT_BASELINE_PRD001.md`

## Contexto

O PRD-001 entregou auth e um stub `/app`. A Fase 3 exige o chrome estável (Sidebar + Topbar + Main) para hospedar PRD-002+, sem regressões auth e sem activar módulos de negócio.

## Decisão

1. **Módulo** `apps/web/modules/shell` com `PlatformShell` + nav declarativa.
2. **Gate de sessão** permanece em `AppShell` (cliente, `kuteka-auth`); o Shell só renderiza quando autenticado.
3. **Nav única** (D3): Início activo; Patrimónios / Confiança / Habitação = Em breve; Administração se `admin.panel`.
4. **Permissões** carregadas via `get_user_permission_codes` para a nav Admin.
5. **Mobile:** drawer overlay; Escape / backdrop fecham.
6. **Sem** KAI, busca, notificações, command palette, role-switch.
7. **Sem** migration Supabase nova.

## Consequências

- `(auth)` continua fora do Shell.
- `/app` e `/app/admin` partilham o mesmo chrome.
- Fundação visual pronta para PRD-002 (Patrimónios passará de Em breve a activo nesse PRD).
- Static export / Deploy Kuteka mantidos.
