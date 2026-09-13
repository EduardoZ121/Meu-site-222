# Landing Page — Implementation Notes

**Estado:** **Encerrada** (4 níveis aprovados)  
**Branch:** `cursor/landing-page-f96b`  
**Contrato:** PASSO 0 · PASSO 1 · PASSO 1A  
**Validação final:** `LANDING_FUNCTIONAL_VISUAL_VALIDATION.md`

## Entregue

- Landing em `apps/web` (`(marketing)` + `modules/landing`)
- Secções A–F na ordem oficial
- Copy oficial em `content.ts` (separado da estrutura)
- Design System `@kuteka/ui` (inclui variante `outline` para CTA secundário)
- Hero full-bleed + overlay Slate; CTAs Orange / outline
- Explorar → `#diferenca` (temporário até `/explorar`)
- Começar / Entrar → `/auth` placeholder (sem fluxo autenticado; P0 bloqueia PRD-001)
- SEO: title, description, Open Graph, canonical
- A11y: skip link, h1 único, focus rings, reduced motion
- Motion: hero stagger + scroll reveal ≤ 250 ms
- Placeholders: Termos, Privacidade, Contacto

## Fora de âmbito (respeitado)

- Auth de produto / dashboards / KAI / listagens
- Social proof fabricado / stats
- Alteração DNS

## Próximo

Auto-revisão técnica da Landing → testes → validação → aprovação final.
