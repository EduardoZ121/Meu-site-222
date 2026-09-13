# FASE 0 — Registo de Decisões Pendentes

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Estado** | Activo — **não resolver unilateralmente** |
| **Formato** | Cada item = `DECISÃO PENDENTE` conforme autorização final Fase 0 |

> Regra: nenhuma destas questões autoriza código, migration, deploy ou alteração substantiva até decisão explícita do responsável indicado.

---

## D1 — Fonte única comissão activação 35%

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Qual via é fonte única de verdade para comissão de activação 35%? |
| **Documentos afectados** | C2, FIN-005, POL-005, Master Table FIN-005, Decision Register DEC-2026-004 |
| **Opções documentadas** | (A) `platform_commission_params` Founder-only · (B) `finance_commission_rules` Super UI · (C) Híbrido A+B · (D) Manter dual até data X |
| **Consequências documentadas** | Divergência preços; risco Super alterar sem alinhar Founder; unificação código bloqueada até decisão |
| **Responsável** | **Founder** |
| **Momento** | Antes de `AUTORIZO: FASE X — unificação comissão` |

---

## D3 — Política demo vs público Beta

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Como rotular/confinar contas e dados DEMO para não confundir utilizadores Beta? |
| **Documentos afectados** | Beta Charter v2 §3, Doc3 BETA-04, QA Playbook T4 nota, Decision Register DEC-2026-005 |
| **Opções documentadas** | Demo interno only · Badge "Exemplo/Ilustrativo" público · Bloqueio total demo em prod Beta |
| **Consequências documentadas** | Percepção enganosa; métricas Beta inválidas; confiança |
| **Responsável** | **Founder** |
| **Momento** | Antes de ciclo Beta público amplo (BETA-40) |

---

## D4 — Nível Growth Engine na Beta

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Até que nível N0–N5 activar Growth funcional durante Beta pública? |
| **Documentos afectados** | Growth Paper §2/§11, Doc3 GROWTH-22, Beta Charter, Decision Register DEC-2026-006 |
| **Opções documentadas** | N0 nada · N1 instrumentação · N2 partilha · N3+ referral/campanhas |
| **Consequências documentadas** | Scope creep; confusão Pay vs pontos; compliance campanhas |
| **Responsável** | **Founder** |
| **Momento** | Antes de qualquer código Growth Engine |

---

## D5 — Activar alteração de email Founder/Co-Founder

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Activar agora o fluxo completo de alteração de email via Security Center? |
| **Documentos afectados** | ADR-027 §4–5, Doc3 DOC3-29.14/29.7, Decision Register DEC-2026-007 |
| **Opções documentadas** | (A) Manter preparado, não activar (Fase 0) · (B) Activar com testes §29.12 |
| **Consequências documentadas** | Activar cedo sem testes = regressão RBAC/audit; adiar = dependência email pessoal |
| **Responsável** | **Founder** |
| **Momento** | Fase dedicada identidade + suite testes ADR-027 |

---

## D7 — Papel contabilista na plataforma

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Contabilista externo tem login RBAC dedicado ou apenas canal documental/off-platform? |
| **Documentos afectados** | FIN pack §RACI, FIN-003, FIN-008, GOV-003, Decision Register DEC-2026-008 |
| **Opções documentadas** | (A) Papel read-only futuro · (B) Sem login — entrega mensal offline · (C) Portal export Founder-only |
| **Consequências documentadas** | RACI incompleto; acesso indevido a dados financeiros |
| **Responsável** | **Founder** + **Contabilista** |
| **Momento** | Antes de FIN-008 operacional e pagamentos reais |

---

## D-LEG — Validação instrumentos legais P0

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Aprovação formal LEG-001–003 (Pay, comissões, marketplace) por advogado |
| **Documentos afectados** | LEG pack, ADVICE registry spec, Master Table KUT-ADVICE-* |
| **Opções documentadas** | Validado / Pendente / Rejeitado por instrumento |
| **Consequências documentadas** | Pay real e comissões reais bloqueados sem parecer |
| **Responsável** | **Advogado** + **Founder** |
| **Momento** | Antes Kuteka Pay produção |

---

## D-LEG-RENT — Cobrança de renda e liquidação ao PP (NOVO — 2026-08-29)

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Pode a Kuteka estruturar contratualmente a **cobrança da renda** e a **liquidação do valor ao PP**, recebendo a sua **comissão contratual**, através de uma infraestrutura/PSP autorizada, **sem configurar custódia indevida** de fundos de terceiros? Qual estrutura jurídica e contratual é necessária? |
| **Documentos afectados** | [KUTEKA_RENT_SETTLEMENT_BUSINESS_MODEL_FASE0.md](../finance/KUTEKA_RENT_SETTLEMENT_BUSINESS_MODEL_FASE0.md), LEG-001, LEG-003, LEG-011, ADVICE-001 |
| **Opções documentadas** | (A) Agregador/plataforma com PSP split · (B) Kuteka cobra só comissão; PP recebe directo · (C) Modelo híbrido contrato gestão · (D) Outro — advogado especifica |
| **Consequências documentadas** | Pay renda real bloqueado; risco regulatório BNA; responsabilidade civil |
| **Responsável** | **Advogado** + **Founder** |
| **Momento** | Antes activar cobrança renda real via Kuteka Pay |

**Sub-questões explícitas (não decidir sem parecer):** merchant of record; papel Kuteka vs PP; termos Cliente/PP; limites responsabilidade; enquadramento BNA.

---

## D-FIN — Validação tratamento contabilístico comissões

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Tratamento contabilístico/fiscal comissão 35% e fluxos sandbox |
| **Documentos afectados** | FIN-001, FIN-005, FIN-008, KUT-ADVICE-002 |
| **Opções documentadas** | Conforme parecer contabilista registado |
| **Consequências documentadas** | Risco fiscal; reporting incorrecto |
| **Responsável** | **Contabilista** + **Founder** |
| **Momento** | Antes activação financeira real |

---

## D-FIN-RENT — Contabilização renda / comissão / saldo PP (NOVO — 2026-08-29)

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Como deve ser contabilizado o **valor total recebido** relativo à renda, a **comissão da Kuteka** e o **valor pertencente ao PP**? Qual é o tratamento contabilístico/fiscal correcto? |
| **Documentos afectados** | [KUTEKA_RENT_SETTLEMENT_BUSINESS_MODEL_FASE0.md](../finance/KUTEKA_RENT_SETTLEMENT_BUSINESS_MODEL_FASE0.md), FIN-001, FIN-004, FIN-008, ADVICE-002, ADVICE-003 |
| **Opções documentadas** | Conforme plano contas e parecer; pass-through vs receita bruta; momento reconhecimento comissão |
| **Consequências documentadas** | IVA/imposto incorrecto; passivo PP mal classificado; auditoria falha |
| **Responsável** | **Contabilista** + **Founder** |
| **Momento** | Antes FIN-008 operacional e cobrança renda real |

---

## D-BCP — Promover BCP/DRP v0.9 → KUT formais

| Campo | Conteúdo |
|-------|----------|
| **Questão** | Executar renomeação/promoção documental BCP v0.9 e DRP v0.9 para KUT-BCP-001 / KUT-DRP-001? |
| **Documentos afectados** | Compliance pack §POL-010, Master Table BCP/DRP |
| **Opções documentadas** | (A) Promover header KUT mantendo conteúdo · (B) Aguardar revisão ops |
| **Consequências documentadas** | Duplicação nomes; confusão auditoria |
| **Responsável** | **Founder** + **Ops** |
| **Momento** | Fase documental ops ou Fase 1 infra |

---

## Precedência documental (já estabelecida — não alterar)

| Conflito | Regra prevalecente |
|----------|-------------------|
| FIN IDs Doc1 vs Doc2 | **C1** (2026-08-28 Founder) |
| Comissão dual path | **C2** documenta ambas; **D1** resolve |
| Beta Charter v1.4 vs v2 | **Ambos** — v1.4 sprints; v2 ecossistema |
| Growth vs Beta freeze | **Growth bloqueado** até **D4** |

---

## Referências

- [Decision Register template](../templates/KUT-GOV-002_DECISION_REGISTER_TEMPLATE.md)
- [Handover](./KUTEKA_FASE0_HANDOVER_2026-08-28.md)
- [Manifest](./KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md)
