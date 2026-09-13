# Kuteka — Modelo de negócio: cobrança de renda e liquidação ao PP (Fase 0)

| Campo | Valor |
|-------|-------|
| **ID** | KUT-BIZ-RENT-001 |
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-29 |
| **Estado** | **Requisito de negócio documentado** — **NÃO** aprovado jurídica/contabilisticamente |
| **Autorização** | Documentação Fase 0 apenas — sem código, Pay real, PSP ou deploy |
| **Relates** | FIN-001, FIN-002, FIN-005, FIN-008, FIN-010, LEG-001, LEG-003, LEG-011, C2, POL-005 |

> **Aviso:** Este documento regista a **intenção de negócio** do Founder para validação por advogado e contabilista. **Não** constitui parecer legal, decisão fiscal, escolha de PSP, nem autorização de implementação.

---

## 1. Distinção crítica (custódia vs processamento)

| Conceito | Significado na Kuteka (intenção documentada) |
|----------|-----------------------------------------------|
| **Custódia indevida** | Kuteka **reter para si** fundos que pertencem ao PP ou Cliente, além da **remuneração contratual** acordada, ou usar fundos de terceiros como se fossem caixa Kuteka |
| **Processamento / cobrança / liquidação** | Cliente paga renda **através** de infraestrutura de pagamento autorizada (PSP/gateway); valor devido ao PP é **encaminhado/liquidado ao PP**; comissão Kuteka é **deduzida ou cobrada conforme contrato** |

**Frases existentes noutros documentos** (“Kuteka não segura dinheiro do cliente”, `custody_mode = none`) **não devem** ser lidas como “Kuteka nunca participa no fluxo de pagamento”.

Interpretação Fase 0 (pendente validação D-LEG / D-FIN):

- **Proibido assumir** (até parecer): Kuteka como custodiante de fundos de terceiros fora de enquadramento legal.
- **Permitido explorar** (com estrutura adequada): cobrança da renda via Kuteka Pay + PSP, com **split/liquidação** ao PP e **comissão Kuteka** conforme contrato.

---

## 2. Cenário de negócio (8 passos — intenção Founder)

| # | Passo |
|---|--------|
| 1 | Kuteka identifica um **Parceiro Patrimonial (PP)** com imóvel |
| 2 | Kuteka pode **valorizar/preparar** o imóvel para colocação no mercado |
| 3 | Kuteka celebra **relação contratual** com o PP e/ou estrutura operação de exploração/aluguer |
| 4 | **Cliente** aluga o imóvel e paga a **renda** através da infraestrutura Kuteka Pay (PSP) |
| 5 | Durante o período contratual, Kuteka recebe **comissão prevista** (ex.: **35%** em activação/intermediação quando aplicável — ver C2/POL-005; **sem alterar** regra existente) |
| 6 | O **restante** valor da renda pertence ao **PP** e deve ser **encaminhado/liquidado** ao PP |
| 7 | Quando a obrigação/comissão contratual Kuteka estiver completa ou o contrato terminar, o fluxo **termina ou altera-se** conforme contrato |
| 8 | **Intenção:** Kuteka **não se apropria** do dinheiro do PP; participa na **cobrança/liquidação** e recebe **remuneração contratual** |

---

## 3. Fluxo financeiro pretendido (diagrama conceptual)

```
Cliente ──(renda)──► Infraestrutura pagamento (PSP/gateway)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      Comissão Kuteka    Taxas PSP*     Saldo PP
      (ex. 35% se        (se aplicável)  (liquidado ao PP)
       aplicável C2)
```

\* Taxas PSP: tratamento contabilístico = **D-FIN**.

**Ledger (intenção alinhada com Arquitectura Financeira v1.0):**

- `charge` — cobrança ao Cliente (renda)
- `commission` — comissão Kuteka
- `payout_instruction` — instrução liquidação ao PP (**sem** assumir custódia Kuteka — ver FIN base)

---

## 4. Papéis

| Actor | Papel no fluxo (intenção) |
|-------|---------------------------|
| **Kuteka** | Intermediação/gestão operacional; cobrança via Pay; comissão contratual; **não** retenção indevida do saldo PP |
| **PP** | Proprietário/beneficiário do saldo renda (após comissão/obrigações contratuais) |
| **Cliente** | Pagador da renda |
| **PSP/Gateway** | Processamento autorizado (entidade concreta = **TBD**) |
| **Agente/Prestador** | Fora deste fluxo base salvo contrato específico |

---

## 5. Comissão Kuteka

- Regra existente **inalterada:** comissão activação **35%** (1.º mês intermediação) — Founder-only — ver [C2](./C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md) e POL-005.
- **D1 pendente:** fonte técnica única (`platform_commission_params` vs `finance_commission_rules`).
- Vigência, retroactividade e alteração: conforme políticas já documentadas (**sem retroactividade**).

---

## 6. Destino do saldo PP

**Intenção:** após dedução da comissão Kuteka (e taxas contratualmente previstas), o valor pertencente ao PP deve:

1. Ser identificado no Ledger como obrigação de repasse/liquidação ao PP
2. Ser liquidado ao PP via PSP/transferência conforme estrutura aprovada
3. Terminar ou alterar-se quando o contrato/obrigação Kuteka terminar

**Não documentado ainda:** calendário de repasse, hold periods, merchant of record, conta de destino PP.

---

## 7. O que já existia noutros documentos (referências)

| Documento | O que já contempla |
|-----------|-------------------|
| [ARQUITETURA_FINANCEIRA_KUTEKA.md](../../finance/ARQUITETURA_FINANCEIRA_KUTEKA.md) §7.2 | `payout_instruction`; fluxo genérico comissão + liquidação |
| Idem §8.3 passo 6 | Comissão + instrução liquidação destinatário |
| Idem §12.2 | Rendas — lembretes, cobrança; **genérico** |
| Idem §8.5, §23 | Split; custódia Fase 1 = não; B2B preferencial |
| [C2](./C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md) | 35% activação intermediação |
| [FIN pack](./KUT-FIN_PACK_DRAFTS_v0.1.md) FIN-002 | Linha activação arrendamento TBD |
| [FIN-008](./KUT-FIN_PACK_DRAFTS_v0.1.md) | "Comissões vs repasse" no export mensal |
| [LEG-003](../legal/KUT-LEG_PACK_DRAFTS_v0.1.md) | Cliente → PSP → beneficiários (outline) |
| [LEG-011](../legal/KUT-LEG_PACK_DRAFTS_v0.1.md) | Termos PP (rascunho) |
| [STR-001](../governance/KUT-STR-001_BUSINESS_MODEL_CANVAS_DRAFT_v0.1.md) | Intermediação, comissão 35% |

---

## 8. Lacuna Fase 0 (porque este documento existe)

O cenário **completo** PP → preparação → contrato → Cliente paga renda → comissão Kuteka → saldo PP **não estava** num único artefacto Fase 0 com distinção custódia/processamento.

Documentos anteriores tratam **fragmentos** (comissão, Pay genérico, payout_instruction) mas **não** fecham o fluxo de negócio de arrendamento como requisito explícito.

---

## 9. Decisões **NÃO** tomadas neste documento

| Tema | Estado |
|------|--------|
| Kuteka pode legalmente receber/custodiar fundos terceiros | **Bloqueado** — advogado (D-LEG-RENT) |
| Merchant of record | **TBD** |
| PSP/banco/gateway concreto | **TBD** |
| Tratamento fiscal definitivo | **Bloqueado** — contabilista (D-FIN-RENT) |
| Estrutura contratual definitiva PP/Cliente/Kuteka | **Bloqueado** — advogado (LEG-001, LEG-011) |
| Implementação código / Pay real | **Bloqueado** — Fase 1+ com `AUTORIZO` |

---

## 10. Questões para validação profissional

Ver [KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md](../consolidation/KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md):

- **D-LEG-RENT** — enquadramento jurídico cobrança + liquidação PP
- **D-FIN-RENT** — contabilização renda total / comissão / saldo PP

---

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1-DRAFT | 2026-08-29 | Registo requisito negócio pós-verificação Founder |
