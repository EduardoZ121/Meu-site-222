# Relatório de maturidade — Kuteka Platform Core v1.0

**Data:** 2026-08-01  
**Baseline:** `docs/product/KUTEKA_PLATFORM_CORE_V1.md`  
**ADR:** `docs/architecture/ADR-011-core-v1-freeze.md`

## Sumário executivo

O Core v1.0 está **funcional e demonstrável** para parceiros e investidores, com atmosfera premium, fluxo encadeado e inventário demo. Não está ainda endurecido para **beta pública anónima** sem checklist go-live (credencial demo, media pública, upload de confiança).

**Nota de maturidade global:** ~**B+ / pronto para demo controlada**; gap principal = endurecimento pré-beta, não ausência de módulos Core.

---

## 1. Funcionalidades concluídas (N5 no Core)

| Área               | Estado                | Notas                                                              |
| ------------------ | --------------------- | ------------------------------------------------------------------ |
| Landing            | Concluída             | Hero full-bleed, CTAs, páginas legais básicas                      |
| Auth               | Concluída             | Registo, login, recover, onboarding perfil/papéis, sessão Supabase |
| Shell              | Concluída             | Nav, atmosfera, glass, marca `lg`, drawer mobile                   |
| Patrimónios        | Concluída             | CRUD próprio, media, preço AOA, activação                          |
| Habitação          | Concluída             | Preferências, explorar, filtros, interesse                         |
| Agente             | Concluída (ops reais) | Preferências, explorar, acompanhamento                             |
| Administração      | Concluída             | Stats, utilizadores, activar agente, interesses pendentes          |
| Confiança          | Concluída (notas)     | Submissão + revisão admin com estados                              |
| Premium Experience | Concluída             | Directiva permanente + implementação shell                         |
| Design System      | Concluída (base)      | `@kuteka/ui` + tokens usados nos módulos                           |

---

## 2. Parcialmente concluídas

| Área                      | Lacuna                                                                 | Impacto                                              |
| ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| Confiança                 | Submissão por notas — sem upload de ficheiros                          | Demo OK; beta precisa storage de docs                |
| Agente                    | Visitas / propostas / agenda reais                                     | Pipeline demo ilustrativo quando sem `agent.operate` |
| Admin vs matriz           | `properties.manage` no admin não implica UPDATE de patrimónios alheios | Alinhamento produto/RLS                              |
| Notificações / Definições | Botões «em breve» na shell                                             | Cosmético                                            |
| Toasts                    | Stub provider                                                          | Erros usam banners inline                            |

---

## 3. Simuladas / demo

| Item                               | Onde                  | Política Core v1.0                                                        |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------- |
| 5 anúncios Angola (`KTK-DEMO-*`)   | Habitação / seed 0009 | Mantidos para demo; badge «Demo»                                          |
| Conta `demo.parceiro@kuteka.local` | Migration 0009        | **Desactivar** via `disable_demo_partner_account()` antes de beta pública |
| Pipeline visitas/agenda Agente     | `AGENT_DEMO_PIPELINE` | Explicitamente marcado como demonstração                                  |
| Atmosfera CDN (Unsplash/Mixkit)    | Shell                 | Fallback local `/images/hero.jpg`                                         |

---

## 4. Backlog (fora do Core v1.0)

Ordem de expansão pós-auditoria:

1. Contratos
2. Pagamentos
3. Wallet
4. Passaporte Imobiliário
5. Academia
6. CRM
7. KAI

Metodologia: N1→N5 integral, revisão crítica pré-merge, sem ciclos intermédios de aprovação.

---

## 5. Riscos técnicos

| Sev               | Risco                                   | Mitigação no Core v1.0                                 |
| ----------------- | --------------------------------------- | ------------------------------------------------------ |
| Alto              | Credencial demo em migration histórica  | RPC `disable_demo_partner_account` + checklist go-live |
| Alto (corrigido)  | UPDATE amplo em `property_interests`    | Migration `0010` — UPDATE scoped                       |
| Médio (corrigido) | Enumeração RBAC cross-user              | `get_user_*` scoped a self/admin em `0010`             |
| Médio             | Bucket `property-media` público         | Documentado; endurecer em pré-beta                     |
| Médio             | Dependência CDN atmosfera               | Fallback local; mobile usa `hero-mobile`               |
| Baixo             | Middleware skip se env Supabase ausente | Soft-gate AppShell                                     |

---

## 6. Dívida técnica (aceite no freeze)

- Superfícies glass vs cards sólidos ainda misturadas (CSS override global).
- `GlassSurface` / `HeroMedia` legacy pouco usados.
- Sem revoke de agente; sem RPC de assign de interesse.
- Personas demo cliente/agente/admin incompletas (só parceiro demo).
- Upload confiança e avatars sem policies completas.
- Focus trap completo no drawer mobile (focus inicial OK; trap total pendente).

---

## 7. Preparação para produção / beta pública

### Pronto agora

- Demo autenticada controlada
- Apresentação a parceiros/investidores
- Fluxo: Parceiro → Habitação → Interesse → Agente (demo/ops) → Confiança → Admin

### Antes de beta pública

- [ ] Correr `disable_demo_partner_account()` (ou equivalente)
- [ ] Rotacionar qualquer secret conhecido
- [ ] Aplicar migration `0010` em todos os ambientes
- [ ] Decidir privacidade do bucket media (drafts)
- [ ] Upload real de documentos Confiança
- [ ] Smoke E2E mobile/tablet/desktop com contas reais multi-papel
- [ ] Revisar `docs/backlog/GO_LIVE_CHECKLIST.md`

### Auditoria Core v1.0 (esta entrega)

Correções aplicadas autonomamente: session-error gates, nav por permissão, becos Admin→Agente, ForbiddenPanel + FlowNextSteps, detail sem `?id`, ModuleIntro sem título duplicado, atmosfera mobile, a11y skeleton/galeria/drawer, RLS interests + RBAC scope.

---

## 8. Decisão

**Core v1.0 congelado.** Expansão para Contratos pode iniciar após merge deste baseline.
