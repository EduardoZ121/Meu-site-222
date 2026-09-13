# Fase 3 — Engineering Gate (Shell da Plataforma)

**Estado:** ✅ **Verde** — Aprovação Funcional + implementação N5  
**Spec:** `docs/proposals/PHASE_3_PLATFORM_SHELL_SPEC.md` v0.9  
**Baseline:** `docs/PROJECT_BASELINE_PRD001.md`

## Objectivo

Confirmar prontidão técnica para implementar o Shell **sem** novas dependências de infra além da baseline.

## Pré-requisitos (herdados — já ✅)

| Item                                   | Estado |
| -------------------------------------- | ------ |
| CI quality                             | ✅     |
| Supabase remoto + migrations 0001–0003 | ✅     |
| Domínio / Deploy Kuteka                | ✅     |
| PRD-001 N5 / baseline congelada        | ✅     |
| Sessão browser `kuteka-auth`           | ✅     |

## Checklist específico do Shell (activar na implementação)

| #   | Item          | Critério                                                 |
| --- | ------------- | -------------------------------------------------------- |
| G1  | Static export | Shell e drawer funcionam sem middleware Next em produção |
| G2  | Sessão        | Gate `/app` continua cliente-safe; sem regressão F1–F6   |
| G3  | RBAC nav      | Item Admin só com `admin.panel`                          |
| G4  | a11y          | Drawer teclado + foco; landmarks sidebar/main            |
| G5  | Âmbito        | Sem KAI / Passaporte / SCK / command palette             |
| G6  | Publish       | `prebuilt/web-out` + Deploy Kuteka verdes                |

## Resultado esperado

Gate **verde por herança** + checklist G1–G6 verificado durante implementação.  
Não bloqueia arranque se a Autorização condicional §12 da spec estiver activa.
