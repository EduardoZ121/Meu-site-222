# Kuteka Platform Core v1.0

**Estado:** Congelado · 2026-08-01  
**Commit de referência:** tip de `main` no momento do merge deste documento  
**Âmbito:** baseline definitiva para beta futura e apresentações a parceiros/investidores

## Declaração de congelamento

Este documento define o **Kuteka Platform Core v1.0**.

A partir da publicação deste baseline:

1. Nenhuma alteração **estrutural** ao Core (modelo RBAC, shell, contratos de módulos congelados, identidade visual premium) sem abertura formal de **Core v1.1+** ou **Core v2.0**.
2. Correcções de defeitos, hardening de segurança, copy e polish visual **dentro** dos módulos Core são permitidas sem bump de versão major, desde que não alterem a arquitectura congelada.
3. Novos módulos (Contratos, Pagamentos, Wallet, Passaporte Imobiliário, Academia, CRM, KAI) vivem **fora** do Core v1.0 e seguem metodologia N1→N5.

## Conteúdo do Core v1.0

| Camada             | Âmbito                                        | Referência                                         |
| ------------------ | --------------------------------------------- | -------------------------------------------------- |
| Landing            | Experiência pública / marketing               | ADR-002                                            |
| Auth               | Conta, sessão, onboarding de papéis           | PRD-001 · ADR-004                                  |
| Shell              | Navegação, atmosfera full-bleed, glass, marca | Fase 3 · ADR-005                                   |
| Patrimónios        | Publicação, media, preço AOA                  | PRD-002 · ADR-006                                  |
| Habitação          | Exploração, preferências, interesse           | PRD-003 · ADR-007                                  |
| Agente             | Cobertura, acompanhamentos (+ demo pipeline)  | PRD-004 · ADR-008                                  |
| Administração      | Utilizadores, stats, activação de agente      | PRD-005 · ADR-009                                  |
| Confiança          | Submissão e revisão de verificação            | PRD-006 · ADR-010                                  |
| Listing experience | Galeria, inventário demo, fluxo encadeado     | PRD-007                                            |
| Design System      | `@kuteka/ui`, tokens, tipografia, componentes | `packages/ui`                                      |
| Premium Experience | Atmosfera, glass, fluxo contínuo, marca forte | `docs/engineering/PREMIUM_EXPERIENCE_DIRECTIVE.md` |

## Identidade permanente (não negociável no Core)

- Fundo full-bleed (`AtmosphereBackground`) — nunca banners-cartão inset.
- Conteúdo sobre painéis glass com legibilidade.
- Marca KUTEKA reforçada (`BrandMark` size `lg` na shell).
- Fluxo contínuo (`FlowNextSteps`) em vez de becos «Voltar».
- Dados demo suficientes para validar o percurso.
- Conclusão integral N5 por módulo novo.

## Política de versão

| Tipo de mudança                              | Acção                                           |
| -------------------------------------------- | ----------------------------------------------- |
| Bugfix / a11y / segurança no Core            | Patch no Core v1.0 (sem nova versão de produto) |
| Extensão de API/RLS que altera contrato Core | Abrir **Core v1.1** com ADR                     |
| Redesign estrutural da shell ou RBAC         | Abrir **Core v2.0**                             |
| Novo módulo de produto                       | Fora do Core; ADR + PRD próprios                |

## Documentos irmãos

- Relatório de maturidade: `docs/backlog/CORE_V1_MATURITY_REPORT.md`
- ADR de congelamento: `docs/architecture/ADR-011-core-v1-freeze.md`
- Continuidade: `docs/backlog/CONTINUIDADE_DESENVOLVIMENTO.md`
- Checklist go-live: `docs/backlog/GO_LIVE_CHECKLIST.md`
