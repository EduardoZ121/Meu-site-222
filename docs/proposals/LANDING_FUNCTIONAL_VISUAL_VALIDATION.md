# Landing Page — Validação Funcional e Visual

**Documento:** 4.º nível de validação (encerramento do módulo)  
**Data:** 2026-07-29  
**Branch:** `cursor/landing-page-f96b`  
**Contrato:** PASSO 0 · PASSO 1 · PASSO 1A · ADR-002  
**Artefactos:** `/opt/cursor/artifacts/landing-validation/` (screenshots desktop / tablet / mobile)

---

## Resultado

**Validação funcional e visual: APROVADA**  
**Módulo Landing: ENCERRADO** (após os quatro níveis)

| Nível                           | Estado                                     |
| ------------------------------- | ------------------------------------------ |
| 1. Implementação                | ✅                                         |
| 2. Auto-revisão técnica         | ✅ `LANDING_TECHNICAL_REVIEW.md`           |
| 3. Testes                       | ✅ unit + Playwright + script de validação |
| 4. Validação funcional e visual | ✅ Este documento                          |

---

## Método

- Servidor de produção local (`next start`)
- Script `apps/web/scripts/validate-landing.mjs` (desktop 1280, tablet 820, iPhone 13)
- Screenshots hero / diferença / como funciona / full-page
- Revisão visual humana dos artefactos
- Confirmação SEO (title, description, OG, canonical)

---

## Matriz por secção

| Secção          | Spec | DS / Identidade                 | UX / Clareza              | Responsive                 | A11y             | Notas                                                  |
| --------------- | ---- | ------------------------------- | ------------------------- | -------------------------- | ---------------- | ------------------------------------------------------ |
| A Topbar        | ✅   | ✅ Orange CTA                   | ✅                        | ✅ Entrar oculto no mobile | ✅               | Glass claro após sair do hero (ajuste desta validação) |
| B Hero          | ✅   | ✅ Full-bleed + overlay Slate   | ✅ ≤3s                    | ✅ CTAs empilhados         | ✅ h1 único, alt | Title SEO absoluto corrigido                           |
| C Diferença     | ✅   | ✅ 3 pilares, sem cards pesados | ✅ Mensagem anti-anúncios | ✅ 1→3 cols                | ✅               | —                                                      |
| D Como funciona | ✅   | ✅ 1·2·3 mono Orange            | ✅                        | ✅                         | ✅               | Reveal com fallback de segurança                       |
| E Fecho         | ✅   | ✅ Slate denso + 1 CTA          | ✅                        | ✅                         | ✅               | —                                                      |
| F Footer        | ✅   | ✅ Mínimo institucional         | ✅                        | ✅                         | ✅               | Placeholders legais (esperado)                         |

---

## Critérios transversais

| Critério                       | Resultado                                                     |
| ------------------------------ | ------------------------------------------------------------- |
| Conformidade PASSO 0 / 1 / 1A  | ✅                                                            |
| Fidelidade Design System       | ✅ Kuteka Orange só em acções primárias / acentos             |
| Identidade (não classificados) | ✅                                                            |
| Clareza de comunicação         | ✅ H1 + CTAs inequívocos                                      |
| UX                             | ✅ Explorar → `#diferenca`; Começar → `/auth` placeholder     |
| Responsividade                 | ✅ desktop / tablet / mobile                                  |
| Acessibilidade                 | ✅ skip link, headings, focus, reduced motion, contraste hero |
| Desempenho (lab local)         | ✅ DCL ~24–50 ms / load ~80–110 ms no ambiente de teste       |
| SEO                            | ✅ title correcto (sem sufixo duplicado), meta, OG, canonical |

---

## Ajustes aplicados nesta validação

1. **SEO title** — `metadata.title.absolute` para evitar `… · Kuteka` duplicado pelo template do root layout.
2. **Reveal** — fallback de segurança (1,2 s) + show imediato se já no viewport; evita secções permanentemente ocultas.
3. **Topbar** — glass claro com texto escuro ao entrar nas secções claras (PASSO 1: glass discreto, sem competir com o conteúdo).

Nenhum problema estrutural relevante encontrado.

---

## Fora de âmbito (aceite)

- Conteúdo jurídico final (Termos / Privacidade)
- `/explorar` com listagem real
- Auth de produto (bloqueada por P0)
- Fotografia angolana própria no hero (substituível sem redesign — ADR-002)

---

## Decisão

A Landing Page é a **experiência pública oficial** da Kuteka e esta fase considera-se **encerrada**.

**Aprovação de produto (2026-07-29):** encerramento oficial confirmado pela equipa após revisão da validação funcional e visual e dos quatro níveis.

Próximo foco do roadmap: concluir `docs/backlog/P0_PRE_AUTH.md`, depois PRD-001 Authentication — sem novas regras globais de processo.
