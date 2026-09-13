# PRD-001 — Encerramento oficial (N5)

**Data:** 2026-07-31  
**Decisão PO:** Encerrar PRD-001 no estado actual — sem novas rondas de QA cosmético no stub `/app`.  
**Spec:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**ADR:** `docs/architecture/ADR-004-authentication-module-deferred.md`  
**Produção:** https://kutekalink.com (`/auth/*` · `/app` · `/app/admin`)  
**Baseline congelada:** `docs/PROJECT_BASELINE_PRD001.md`

---

## Quatro níveis de encerramento

| #   | Nível                        | Estado | Evidência                                                                                                                                                |
| --- | ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Implementação concluída      | ✅     | Módulo `apps/web/modules/authentication`; rotas `(auth)` / `(app)`; RPC `activate_self_serve_roles`; session browser (`kuteka-auth`); `prebuilt/web-out` |
| 2   | Auto-revisão técnica         | ✅     | CI quality verde; static-export gate cliente; RBAC/admin client-safe; PRs #5–#12                                                                         |
| 3   | Testes                       | ✅     | Unit (`@kuteka/auth`, `@kuteka/validation`); smoke de fluxo em produção; QA Review 001–002                                                               |
| 4   | Validação funcional e visual | ✅     | PO: fluxo Registo → Verificação → Login → Onboarding → `/app` funcional e alinhado ao PRD-001; UX stub aceite para esta fase                             |

**Maturidade do módulo:** **N5** — implementado e validado.

---

## Âmbito entregue

- F1 Registo · F2 Verificar · F3 Entrar · F4 Sair · F5 Recuperar · F6 Onboarding (papéis + perfil)
- Conta única multi-papel (`client` / `patrimonial_partner` self-serve)
- Stub autenticado `/app` + `/app/admin` (`admin.panel`)
- Supabase project `vhqwitbrpqaiutjbundo` (migrations `0001`–`0003` + seed)
- Runtime config `kuteka-config.js` + Deploy Kuteka (gh-pages + Render)

## Explicitamente fora de âmbito (mantido)

- Shell completo da plataforma (sidebar/topbar de produto)
- Dashboards / Patrimónios / Passaporte / KAI / SCK
- OAuth · MFA · telefone auth · UI de gestão de papéis pós-MVP

---

## Próximo passo de produto

Conforme `docs/AI_CONTEXT.md` §12:

1. **Shell da plataforma** (fase 3) — chrome autenticado estável para os módulos seguintes
2. Depois: **PRD-002 — Parceiro Patrimonial**

Não reabrir PRD-001 excepto erro crítico que impeça o funcionamento do fluxo auth.
