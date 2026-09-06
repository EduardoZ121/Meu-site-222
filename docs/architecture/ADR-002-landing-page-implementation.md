# ADR-002 — Landing Page Implementation Decisions

**Estado:** Aceite  
**Data:** 2026-07-29  
**Contexto:** Implementação da Landing após encerramento da FASE 1  
**Contrato:** PASSO 0 · PASSO 1 · PASSO 1A

## Decisões

### 1. Conteúdo separado da estrutura

Copy e rotas em `apps/web/modules/landing/content.ts`.  
**Motivo:** Longevidade (PASSO 1A §16) — copy pode evoluir sem redesenhar componentes.

### 2. Explorar → `#diferenca`

Enquanto `/explorar` não existir, scroll suave para a secção de diferenciação.  
**Motivo:** Recomendação oficial PASSO 1A §8.4 — evita CTA morto.

### 3. Começar / Entrar → `/auth` placeholder

Página técnica sem fluxo de autenticação de produto.  
**Motivo:** PRD-001 bloqueado pelo backlog P0; CTAs não podem ficar mortos.

### 4. Variante `outline` em `@kuteka/ui` Button

Adicionada para CTA secundário reutilizável na plataforma.  
**Motivo:** PASSO 1 exige secundário outline/ghost; DS deve cobrir o padrão.

### 5. Fotografia de hero

Imagem atmosférica de arquitectura residencial contemporânea em `public/images/hero.jpg` (full-bleed + overlay Slate).  
**Motivo:** PASSO 1A §10.2 — fotografia atmosférica, não collage/stock óbvio de “pessoas com laptop”.  
**Nota:** Pode ser substituída por fotografia angolana própria sem mudar layout.

### 6. Sem Storybook nesta entrega

Catálogo continua em `/dev/ui`; Landing usa primitivos do DS.  
**Motivo:** ADR-001 — evitar overhead; foco na experiência pública.

## Ajustes pós-validação visual (2026-07-29)

- Title SEO com `absolute` (evita sufixo duplicado do layout).
- Reveal com fallback temporal + show imediato se já no viewport.
- Topbar glass claro nas secções claras após scroll.

## Não decidido / futuro

- `/explorar` público real
- JSON-LD Organization (quando dados legais fechados)
- Instrumentação analytics (`landing_view`, CTAs)

## Encerramento

Módulo Landing encerrado após validação funcional e visual — ver `docs/proposals/LANDING_FUNCTIONAL_VISUAL_VALIDATION.md`.
