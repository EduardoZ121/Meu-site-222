# KUT-LEG Pack — Rascunhos v0.1

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-28 |
| **Estado** | Rascunho — **aguarda advogado** |
| **IDs** | KUT-LEG-001 a KUT-LEG-043 |

> **Aviso legal:** Cursor não inventa requisitos jurídicos. Estes rascunhos consolidam intenção dos documentos Founder e mapeiam instrumentos existentes. **Não são válidos juridicamente** até revisão de advogado licenciado em Angola.

## Mapa de instrumentos

| ID | Título | Base existente | Estado | Acção Fase 0 |
|----|--------|----------------|--------|--------------|
| LEG-001 | Modelo Jurídico e Operacional | — | 🔴 | Rascunho outline |
| LEG-002 | Legal Activity Matrix | — | 🔴 | Rascunho outline |
| LEG-003 | Kuteka Pay Regulatory Model | Pay sandbox | 🟡 | Rascunho + ADVICE-001 |
| LEG-010 | Termos do Cliente | [`TERMOS_UTILIZACAO_v1.md`](../../legal/TERMOS_UTILIZACAO_v1.md) | 🟡 | Mapear v1 → LEG-010 |
| LEG-011 | Termos PP | — | 🔴 | Rascunho |
| LEG-012 | Termos Agente | — | 🔴 | Rascunho |
| LEG-013 | Termos Prestador | — | 🔴 | Rascunho |
| LEG-014 | Termos B2B | — | 🔴 | Rascunho |
| LEG-015 | Advertising Terms | — | 🔴 | Rascunho |
| LEG-016 | Service Terms | — | 🔴 | Rascunho |
| LEG-020 | Política Privacidade | [`POLITICA_PRIVACIDADE_v1.md`](../../legal/POLITICA_PRIVACIDADE_v1.md) | 🟡 | Mapear → POL-002 também |
| LEG-021 | Política Cookies | [`POLITICA_COOKIES_v1.md`](../../legal/POLITICA_COOKIES_v1.md) | 🟡 | Mapear |
| LEG-022 | Retenção de dados | — | 🔴 | Rascunho |
| LEG-023 | Acesso a dados | — | 🔴 | Rascunho |
| LEG-024 | Incidente de dados | — | 🔴 | Rascunho |
| LEG-030 | KYC/Verificação | Trust/KYC código | 🟡 | Alinhar PRD-009 |
| LEG-031 | Moderação | Trust código | 🟡 | Rascunho |
| LEG-032 | Denúncias | Trust código | 🟡 | Rascunho |
| LEG-033 | Avaliações/Reputação | Reviews código | 🟡 | Rascunho |
| LEG-034 | Suspensão contas | — | 🔴 | Rascunho |
| LEG-035 | Conflitos interesse | — | 🔴 | Rascunho |
| LEG-040 | Agent Code of Conduct | — | 🔴 | Rascunho |
| LEG-041 | Provider Terms & Commercial | — | 🔴 | Rascunho |
| LEG-042 | Advertising Policy | — | 🔴 | Rascunho |
| LEG-043 | Refund & Cancellation | — | 🔴 | Distinto de FIN-009 |

---

## KUT-LEG-001 — Modelo Jurídico e Operacional (outline)

1. Papel Kuteka no mercado angolano (plataforma vs intermediário vs agregador)
2. Relações contratuais por actor (Cliente, PP, Agente, Prestador)
3. Limites de responsabilidade Kuteka
4. Referências LEG-003 (Pay), LEG-010–016
5. Processo de actualização e versionamento (DOC-001)

---

## KUT-LEG-003 — Kuteka Pay Regulatory & Operating Model (outline)

1. Modelo actual: sandbox, sem custódia real
2. Cenários futuros: agregador vs instituição de pagamento
3. Enquadramento BNA (questões para advogado)
4. Fluxo fundos Cliente → PSP → beneficiários
5. Bloqueio activação real até parecer ADVICE-001 validado

---

## Instrumentos v1 publicados — procedimento de promoção

Para LEG-010, LEG-020, LEG-021:

1. Copiar conteúdo v1 para template Legal Pack
2. Atribuir ID KUT-LEG-XXX e versão 1.0-KUT
3. Revisão advogado → versão 1.1 oficial
4. Publicar em `/termos`, `/privacidade`, `/cookies` após autorização

---

## Registo de pareceres (KUT-ADVICE)

Todos os LEG P0 (001–003) requerem parecer registado antes de decisão Pay/comissões reais. Ver templates em [`../templates/`](../templates/).

---

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1-DRAFT | 2026-08-28 | Pack Fase 0 |
