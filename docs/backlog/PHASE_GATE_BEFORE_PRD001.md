# Gate de fase — Antes do PRD-001

**Data:** 2026-07-30  
**Actualização:** Registo oficial de entendimento de produto (aprovação humana)

---

## Decisão oficial de produto (2026-07-30)

A equipa concorda que:

1. O **desenvolvimento da fase anterior está concluído**.
2. Os bloqueios remanescentes são **exclusivamente de infraestrutura e operacionalização** — não de arquitectura nem de implementação de produto.
3. O **P0 está concluído do ponto de vista técnico** (P0-1 / P0-2 aprovados e em `main`).
4. A **especificação do PRD-001** está autorizada a continuar / aprofundar.
5. A **implementação do PRD-001 não está autorizada** até **Engineering Gate** (P1+P2) + **Autorização de Implementação** (Fase 2). A **Aprovação Funcional** (Fase 1) já foi concedida (v1.0).

---

## 1. Código aprovado em `main`?

**Sim.** FASE 1, Landing e P0 técnico integrados em `main`.

| Entrega                           | Estado                             |
| --------------------------------- | ---------------------------------- |
| FASE 1 — Infraestrutura KEOS      | ✅ Merged                          |
| Landing Page (PASSO 1 + 1A)       | ✅ Merged                          |
| P0-1 / P0-2 (RBAC + audit)        | ✅ Merged · aprovados tecnicamente |
| Publish path Landing → `gh-pages` | ✅ Em `main`                       |

---

## 2. Deploy / publicação da Landing

| Alvo                                   | Estado                     |
| -------------------------------------- | -------------------------- |
| Landing KEOS implementada              | ✅                         |
| Publicada em `gh-pages` (GitHub Pages) | ✅                         |
| `kutekalink.com` a servir Landing KEOS | ⏳ Pendente (DNS / Render) |

---

## 3. P0 — entendimento oficial

| Dimensão                                          | Estado                       |
| ------------------------------------------------- | ---------------------------- |
| P0 técnico (código, testes, aprovação P0-1/P0-2)  | ✅ **Concluído**             |
| Activação definitiva do CI no GitHub              | ⏳ Operacional               |
| Aplicação da migration `0002` no Supabase remoto  | ⏳ Operacional               |
| Encerramento documental “P0 oficialmente fechado” | ⏳ Após as duas linhas acima |

---

## 4. Pendências remanescentes (só infra / ops)

1. Activação definitiva do CI (`.github/workflows/ci.yml` no remote + pipeline verde)
2. Aplicação da migration `0002` no ambiente Supabase remoto
3. Actualização do domínio `kutekalink.com` (DNS → Pages e/ou reparar Render)

Estas pendências **devem ser resolvidas antes da implementação do PRD-001**, mas **não bloqueiam** a elaboração da especificação.

---

## 5. Autorização PRD-001

| Actividade                                | Autorizado?                                   |
| ----------------------------------------- | --------------------------------------------- |
| Elaboração da especificação (Blocos 1–4)  | ✅ **Concluída**                              |
| **Aprovação Funcional** (Fase 1)          | ✅ **Oficial** (2026-07-30)                   |
| Engineering Gate                          | ▶️ `docs/backlog/PRD_001_ENGINEERING_GATE.md` |
| **Autorização de Implementação** (Fase 2) | ⏳ Condicional (activa com P1+P2 no Eng Gate) |
| Código de auth de produto                 | ❌ Até P1+P2; depois autorizado de imediato   |

Spec oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (v1.0)

---

## 6. Metodologia

Ver documento canónico: `docs/engineering/DEVELOPMENT_PROCESS.md`.

```
Especificação → Aprovação Funcional → Engineering Gate
→ Autorização de Implementação → Implementação → …
```

- Papel: Arquitecto Principal, Guardião da Consistência e **Líder Técnico**
- Autoavaliação N1–N5; se confiança < 95%, listar factores
- PRDs: **Aprovação Funcional** ≠ **Autorização de Implementação**
- Implementação do PRD-001 **bloqueada** até Engineering Gate (P1+P2) + Fase 2
- Índice: `docs/README.md`
