# Kuteka — Fase 0 — Pacote de Leitura

Documentação consolidada para download (auditoria final 2026-08-28).

---


---


# FASE 0 — Handover Founder / Co-Founder

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Commit local** | `e12272f` (+ revisão final auditoria) |
| **Branch** | `cursor/fase-0-master-dossier-f96b` |
| **Repo canonical** | `EduardoZ121/Site_Angola` |
| **Fork backup** | `vicentemakiese/Site_Angola` (criado; publicação pendente) |

---

## 1. O que foi concluído

| Bloco | Entrega |
|-------|---------|
| **C1–C10** | Master Dossier completo — ver [Manifest v1.1](./KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md) |
| **65 KUT-IDs** | Master Table normalizada (FIN-009/010 incluídos) |
| **80 itens Doc 3** | Tabela validação §29 + Beta + Growth |
| **ADR-027** | Identidade institucional Founder/Co-Founder |
| **Packs** | FIN, LEG, GOV, POL/CMP/BCP/DRP/INC |
| **Beta v2** | Charter + scorecard + QA + reuse map |
| **Growth** | Architecture paper (papel only) |
| **Templates** | MIN, INC, Decision Register, ADVICE spec |
| **Auditoria final** | [Relatório](./KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md) |

**Garantia:** zero código, migrations, deploy, RBAC/RLS/Pay alterados nesta Fase 0.

---

## 2. O que foi validado

- Referências cruzadas principais (C1↔C2↔POL-005↔Master Table)
- 65 entradas `### KUT-*` na Master Table = 65 IDs únicos
- Cópia `product/` Master Table = byte-identical à `consolidation/`
- Ficheiros referenciados existem (BCP/DRP v0.9, legal v1, SPRINT charter, ARQUITETURA_FIN)
- Hierarquia operacional consistente em ADR-027, GOV-001, GOV-003
- Dual path comissão documentado; **não unificado** (correcto per D1)
- Doc 3 mapeado para artefactos Fase 0

---

## 3. O que permanece pendente

| Área | Pendência |
|------|-----------|
| **GitHub oficial** | Push branch `cursor/fase-0-master-dossier-f96b` → `EduardoZ121/Site_Angola` |
| **Fork** | Publicar Fase 0 em `vicentemakiese/Site_Angola` quando Integrations + agente novo |
| **Decisões D1,D3,D4,D5,D7** | Ver [registo](./KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md) |
| **Advogado** | LEG-001–003 P0; pareceres ADVICE |
| **Contabilista** | FIN-008; ADVICE-002; D7 |
| **BCP/DRP KUT** | Promoção v0.9 → KUT-BCP-001/DRP-001 (documental) |
| **Implementação Doc 3** | Majoritariamente 🔴/🟡 — specs only Fase 0 |

---

## 4. Dependências por papel

### Founder (Eduardo)
- Decidir D1, D3, D4, D5, D7
- Merge PR fork → repo oficial (quando publicado)
- `AUTORIZO: FASE 1 — [escopo]` quando ready

### Co-Founder / operacional (vicentemakiese)
- Integrations Cursor ↔ GitHub `vicentemakiese`
- Novo Cloud Agent no fork → push Fase 0
- Preservar agente/sessão até publicação confirmada

### Advogado
- Revisar LEG pack rascunhos P0
- Registar pareceres (spec ADVICE)

### Contabilista
- Validar FIN-001, FIN-005, FIN-008
- Parecer ADVICE-002; papel D7

### GitHub / infra
- Write access repo canonical ou fork
- **Não** usar PAT no agente

---

## 5. O que NÃO está autorizado ainda

- Fase 1+ implementação
- Código, migrations, RLS, RBAC, Kuteka Pay real, PSP, Growth código
- Deploy produção, alterações `kutekalink.com`
- Alterações `meu-site-222` / Remake Pixel
- Unificação comissão sem D1
- Activar email change sem D5 + testes ADR-027

---

## 6. Onde encontrar tudo

| Documento | Caminho |
|-----------|---------|
| Índice | `docs/master-dossier/KUTEKA_MASTER_DOSSIER_INDEX_2026-08-28.md` |
| Master Table | `docs/master-dossier/consolidation/KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md` |
| Doc 3 | `docs/master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md` |
| Checklist entrega | `docs/master-dossier/consolidation/KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md` |
| Decisões pendentes | `docs/master-dossier/consolidation/KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md` |

---

## 7. Sequência recomendada pós-handover

1. Publicar Fase 0 no GitHub (fork ou oficial)
2. Founder lê [Checklist](./KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md) e assina mentalmente C1–C10
3. Resolver decisões D1–D7 por ordem P0
4. Advogado + contabilista nos LEG/FIN P0
5. Só então: `AUTORIZO: FASE 1`

---

## 8. Nota sobre esta sessão Cloud Agent

- Agente actual: `bc-cedc91c8` — repo ligado `eduardoz121/meu-site-222`
- Trabalho Kuteka Fase 0: clone local `/tmp/site-angola-work`
- Branch ponte export (backup): `kuteka-fase0-export-e12272f` em `Meu-site-222` (temporário)

**Fim do handover Fase 0.**


---


# FASE 0 — Checklist final de entrega

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Uso** | Founder/Co-Founder valida antes de fechar Fase 0 |

**Legenda:** ✅ Concluído · 🟡 Parcial · ☐ Pendente · 🔒 Bloqueado externo

---

## A. Autorização e scope

| # | Item | Estado |
|---|------|--------|
| A1 | Trabalho limitado a documentação C1–C10 | ✅ |
| A2 | Sem código/migration/deploy | ✅ |
| A3 | Sem alteração RBAC/RLS/Pay/comissões SQL | ✅ |
| A4 | Sem Fase 1 iniciada | ✅ |

---

## B. Blocos C1–C10

| Bloco | Artefacto | Estado |
|-------|-----------|--------|
| C1 | FIN ID normalization | ✅ |
| C2 | FIN-005 dual path | ✅ |
| C3 | FIN + LEG + STR-001 packs | ✅ |
| C4 | GOV pack + protocolo | ✅ |
| C5 | POL/CMP/BCP/DRP/INC pack | 🟡 BCP/DRP promoção KUT pendente (D-BCP) |
| C6 | ADR-027 | ✅ |
| C7 | Beta Charter v2 + scorecard + QA + reuse | ✅ |
| C8 | Growth Architecture paper | ✅ |
| C9 | Templates MIN/INC/Decision/ADVICE | ✅ |
| C10 | Master Table + Doc3 + Manifest | ✅ |

---

## C. Consolidação

| # | Item | Estado |
|---|------|--------|
| C1 | 65 KUT-IDs na Master Table | ✅ |
| C2 | 80 itens Doc 3 | ✅ |
| C3 | Manifest actualizado | ✅ |
| C4 | Índice dossiê | ✅ |
| C5 | Sync product/ ↔ consolidation/ Master Table | ✅ |
| C6 | Registo decisões pendentes | ✅ |
| C7 | Handover | ✅ |
| C8 | Relatório auditoria final | ✅ |

---

## D. Decisões Founder (não bloqueiam fecho documental)

| ID | Tema | Estado |
|----|------|--------|
| D1 | Fonte comissão 35% | ☐ Pendente |
| D3 | Política demo Beta | ☐ Pendente |
| D4 | Growth nível Beta | ☐ Pendente |
| D5 | Activar email change | ☐ Pendente |
| D7 | Papel contabilista | ☐ Pendente |

---

## E. Terceiros

| # | Item | Estado |
|---|------|--------|
| E1 | Parecer advogado LEG P0 | ☐ |
| E2 | Parecer contabilista FIN P0 | ☐ |
| E3 | ADVICE registry (implementação) | 🔒 Fase futura |

---

## F. GitHub (fora desta execução)

| # | Item | Estado |
|---|------|--------|
| F1 | Push branch Fase 0 repo oficial | 🔒 |
| F2 | Push fork vicentemakiese | 🔒 |
| F3 | PR merge oficial | 🔒 Eduardo |

---

## G. Critério de fecho Fase 0 documental

Fase 0 documental considera-se **concluída** quando:

- [x] C1–C10 existem e estão indexados
- [x] Auditoria final entregue
- [x] Decisões pendentes registadas (não resolvidas unilateralmente)
- [x] Handover legível em <10 min
- [ ] Publicação GitHub *(pendente condições externas)*

---

## H. Assinatura (manual)

| Papel | Nome | Data | OK Fase 0 docs |
|-------|------|------|----------------|
| Founder | | | ☐ |
| Co-Founder | | | ☐ |

---

**Referências:** [Manifest](./KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md) · [Handover](./KUTEKA_FASE0_HANDOVER_2026-08-28.md) · [Auditoria](./KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md)


---


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


---


# FASE 0 — Relatório final de auditoria documental

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Autorização** | Revisão final FASE 0 — documentação [C1–C10] |
| **Commit base** | `e12272f` |
| **Revisão** | Auditoria final + correcções documentais menores |

---

## A. Fase 0 — estado geral

**Estado: CONCLUÍDA (documentalmente)** — pronta para publicação GitHub quando houver condições.

| Dimensão | Avaliação |
|----------|-----------|
| Scope C1–C10 | ✅ Completo |
| Integridade IDs | ✅ 65 KUT-IDs consistentes |
| Doc 3 | ✅ 80 itens mapeados |
| Decisões substantivas novas | ❌ Nenhuma inventada |
| Código / infra | ❌ Nenhuma alteração |
| Publicação GitHub | 🔒 Pendente (permisões) |

A Fase 0 cumpre o objectivo: **base governada documental** para Founder, Co-Founder, advogado e contabilista consultarem antes de Fase 1.

---

## B. Documentos revistos

### Grupo: Master Dossier (raiz)
| Documento | Acção |
|-----------|-------|
| `README.md` | Lido — OK |
| `KUTEKA_MASTER_DOSSIER_INDEX_2026-08-28.md` | Lido — actualizar refs auditoria |

### Grupo: Finance (C1–C3)
| Documento | Acção |
|-----------|-------|
| `C1_FIN_ID_NORMALIZATION_2026-08-28.md` | Lido — OK |
| `C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md` | **Corrigido** link POL-005 |
| `KUT-FIN_PACK_DRAFTS_v0.1.md` | Lido — D7 referenciado → registo pendente |

### Grupo: Legal (C3)
| Documento | Acção |
|-----------|-------|
| `KUT-LEG_PACK_DRAFTS_v0.1.md` | Lido — mapa LEG-001–043; links OK |

### Grupo: Governance (C4)
| Documento | Acção |
|-----------|-------|
| `KUT-GOV_PACK_DRAFTS_v0.1.md` | Lido — hierarquia consistente |
| `KUT-STR-001_BUSINESS_MODEL_CANVAS_DRAFT_v0.1.md` | Lido — OK rascunho |

### Grupo: Compliance (C5)
| Documento | Acção |
|-----------|-------|
| `KUT-POL_CMP_BCP_DRP_INC_PACK_v0.1.md` | Lido — POL-005 alinhado C2; promoção BCP/DRP pendente |

### Grupo: ADR-027 (C6)
| Documento | Acção |
|-----------|-------|
| `ADR-027-founder-institutional-identity.md` | Lido — consistente GOV/Beta |

### Grupo: Beta (C7)
| Documento | Acção |
|-----------|-------|
| `KUTEKA_BETA_CHARTER_v2.md` | Lido — complementa v1.4 |
| `KUTEKA_BETA_SCORECARD_v0.1.md` | Lido — TBD métricas (correcto) |
| `KUTEKA_BETA_QA_PLAYBOOK_v0.1.md` | Lido — 8 testes definidos |
| `KUTEKA_BETA_REUSE_MAP_v0.1.md` | Lido — OK |

### Grupo: Growth (C8)
| Documento | Acção |
|-----------|-------|
| `KUTEKA_GROWTH_ARCHITECTURE_PAPER_v0.1.md` | Lido — D4 pendente documentada |

### Grupo: Templates (C9)
| Documento | Acção |
|-----------|-------|
| `KUT-MIN-2026-001_TEMPLATE.md` | Lido — OK |
| `KUT-INC-2026-001_TEMPLATE.md` | Lido — OK |
| `KUT-GOV-002_DECISION_REGISTER_TEMPLATE.md` | **Actualizado** D5, D7 |
| `KUT-ADVICE_REGISTRY_SPEC_v0.1.md` | Lido — OK spec |

### Grupo: Consolidação (C10)
| Documento | Acção |
|-----------|-------|
| `KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md` | Lido — 65 IDs verificados |
| `KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md` | Lido — 80 itens |
| `KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md` | Actualizado v1.1 |

### Grupo: Novos (auditoria final)
| Documento | Acção |
|-----------|-------|
| `KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md` | **Criado** |
| `KUTEKA_FASE0_HANDOVER_2026-08-28.md` | **Criado** |
| `KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md` | **Criado** |
| Este relatório | **Criado** |

### Referências externas verificadas
| Ficheiro | Existe |
|----------|--------|
| `docs/product/SPRINT_BETA_CHARTER.md` | ✅ |
| `docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md` | ✅ |
| `docs/operations/BUSINESS_CONTINUITY_PLAN_v0.9.md` | ✅ |
| `docs/operations/DISASTER_RECOVERY_PLAN_v0.9.md` | ✅ |
| `docs/legal/POLITICA_PRIVACIDADE_v1.md` | ✅ |
| `docs/product/KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md` | ✅ sync |

---

## C. Correcções efectuadas

| # | Tipo | Detalhe |
|---|------|---------|
| 1 | Link quebrado | C2 → POL-005 apontava ficheiro inexistente `KUT-POL_PACK_DRAFTS_v0.1.md`; corrigido para `KUT-POL_CMP_BCP_DRP_INC_PACK_v0.1.md` |
| 2 | Registo decisões | Decision Register: adicionadas linhas D5 (email) e D7 (contabilista) |
| 3 | Novos artefactos | Pending decisions, handover, checklist, auditoria final |
| 4 | Manifest | v1.0 → v1.1 com auditoria final |

**Nenhuma** correcção alterou regra de negócio, comissão 35%, hierarquia RBAC ou decisões Founder fechadas.

---

## D. Lacunas encontradas (documentais / operacionais)

| Lacuna | Tipo | Acção Fase 0 |
|--------|------|--------------|
| BCP/DRP não renomeados KUT-BCP-001/DRP-001 | Documental | Registado D-BCP; conteúdo v0.9 existe |
| LEG/FIN packs = DRAFT | Validación externa | Aguardar advogado/contabilista |
| ADVICE registry sem UI/tabela | Implementação | Class C — Fase futura |
| Doc3 itens 🔴 (Beta feedback widget, Growth N3+) | Implementação | Spec only — correcto Fase 0 |
| Scorecard métricas TBD | Dados runtime | Preencher na Beta |
| Publicação GitHub | Infra | Handover §GitHub |

---

## E. Decisões pendentes

Ver registo completo: [`KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md`](./KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md)

| ID | Tema | Responsável |
|----|------|-------------|
| **D1** | Fonte única comissão 35% | Founder |
| **D3** | Política demo Beta | Founder |
| **D4** | Nível Growth na Beta | Founder |
| **D5** | Activar alteração email | Founder |
| **D7** | Papel contabilista plataforma | Founder + Contabilista |
| **D-LEG** | Pareceres LEG P0 | Advogado + Founder |
| **D-FIN** | Parecer contabilístico comissões | Contabilista + Founder |
| **D-BCP** | Promover BCP/DRP formais | Founder + Ops |

**Conflitos identificados sem precedência nova:** nenhum além dos já documentados (dual comissão → D1; Growth vs Beta → D4). Não foram resolvidos unilateralmente.

---

## F. Master Table / Manifest — estado

### Master Table
| Verificação | Resultado |
|-------------|-----------|
| Total IDs | **65** (`### KUT-` headings) |
| IDs únicos | **65** |
| FIN-009, FIN-010 | ✅ Presentes |
| Conflitos FIN Doc1/2 | ✅ Resolvidos em C1 |
| Sync product/ copy | ✅ MD5 idêntico |
| Doc 3 separado | ✅ 80 itens sem KUT-ID |

### Manifest
| Campo | Estado |
|-------|--------|
| C1–C10 listados | ✅ |
| Ficheiros localização | ✅ |
| Versões | ✅ v1.1 |
| Dependências | ✅ via índice + pending register |
| Decisões pendentes | ✅ registo dedicado |
| Destinatários | ✅ handover §4 |

**Estado: Existe / validado**

---

## G. Handover — estado

Artefacto: [`KUTEKA_FASE0_HANDOVER_2026-08-28.md`](./KUTEKA_FASE0_HANDOVER_2026-08-28.md)

| Secção | Completo |
|--------|----------|
| Concluído vs pendente | ✅ |
| Dependências Founder/Co-Founder/advogado/contabilista/GitHub | ✅ |
| Proibições Fase 1 | ✅ |
| Caminhos ficheiros | ✅ |

**Estado: Existe / pronto**

---

## H. Itens bloqueados

| Item | Bloqueio | Desbloqueio |
|------|----------|-------------|
| Push GitHub oficial | Permissões `cursor[bot]` / Eduardo | Push manual ou agente no fork |
| Fork publicação | Integrations + agente novo | Co-Founder |
| Fase 1 | Sem `AUTORIZO: FASE 1` | Founder |
| Pay real / PSP | LEG + FIN pareceres | Advogado + contabilista |
| Unificação comissão código | D1 | Founder |
| Email change UI | D5 + testes 29.12 | Founder + engenharia autorizada |
| Growth código | D4 | Founder |

---

## I. Auditoria por grupo (Existe / Parcial / Falta / Precisa decisão)

| Grupo | Estado | Motivo |
|-------|--------|--------|
| **Master Dossier** | **Existe** | Índice + README + 8 pastas |
| **Master Table** | **Existe** | 65 IDs validados |
| **ADR-027** | **Existe** | Accepted; implementação email = futuro |
| **Finance Pack** | **Parcial** | Rascunhos completos; validação contabilista pendente (D-FIN, D7) |
| **Legal Pack** | **Parcial** | Mapa LEG; parecer advogado pendente (D-LEG) |
| **Governance Pack** | **Existe** | Protocolo + GOV-001/003/004 rascunho |
| **Compliance BCP/DRP/INC** | **Parcial** | Pack POL/CMP; BCP/DRP v0.9 não promovidos KUT (D-BCP) |
| **Beta** | **Existe** | Charter v2 + artefactos; implementação UI 🔴 Doc3 |
| **Growth** | **Existe** | Paper only; nível Beta = **Precisa decisão D4** |
| **Templates** | **Existe** | 4 templates operacionais |
| **Doc3** | **Existe** | 80 itens; execução código proibida |
| **Manifest** | **Existe** | v1.1 |
| **Handover** | **Existe** | Criado auditoria final |

---

## J. Consistência temática (resumo)

| Tema | Consistente? | Nota |
|------|--------------|------|
| Founder/Co-Founder identidade | ✅ | ADR-027 + GOV-001 + Doc3 §29 |
| user_id vs email | ✅ | Proibido email como chave |
| Hierarquia operacional | ✅ | Inalterada em todos packs |
| Comissão 35% Founder-only | ✅ | C2 + POL-005; dual path documentado |
| FIN normalização | ✅ | C1 prevalece |
| Compliance / privacidade | ✅ | POL-002 base legal v1 |
| BCP/DRP | 🟡 | Conteúdo v0.9; nomenclatura KUT pendente |
| Beta vs Sprints | ✅ | v2 complementa v1.4 |
| Growth vs Pay | ✅ | Pontos ≠ dinheiro (Growth §3) |
| Papéis advogado/contabilista | 🟡 | Spec ADVICE; pareceres pendentes |
| Nomenclatura KUT-* | ✅ | 65 IDs alinhados C1 |

---

## K. Confirmação — NÃO houve

| Proibido | Confirmado |
|----------|------------|
| Código novo | ✅ Nenhum |
| Migration | ✅ Nenhuma |
| Deploy | ✅ Nenhum |
| Alteração produção | ✅ Nenhuma |
| Fase 1 | ✅ Não iniciada |
| Push GitHub | ✅ Não executado (conforme instrução) |
| Novo Cloud Agent | ✅ Não criado |
| Alteração permissões | ✅ Nenhuma |
| PAT / credenciais pessoais | ✅ Não utilizados |
| Alteração meu-site-222 | ✅ Nenhuma nesta execução |

---

## L. Paragem

**Autorização Fase 0 documental terminada.**

Nenhuma tarefa adicional será iniciada após este relatório.

Próximo passo **externo:** publicação GitHub + decisões Founder D1–D7 + pareceres terceiros.

---

**Documentos de entrega rápida:**

1. [Checklist](./KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md)
2. [Handover](./KUTEKA_FASE0_HANDOVER_2026-08-28.md)
3. [Decisões pendentes](./KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md)
4. [Manifest v1.1](./KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md)


---


# FASE 0 — Manifesto de entrega

| Campo | Valor |
|-------|-------|
| **ID** | KUTEKA-FASE0-MANIFEST |
| **Versão** | 1.1 |
| **Data entrega** | 2026-08-28 |
| **Auditoria final** | 2026-08-28 — ver [`KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md`](./KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md) |
| **Autorização** | `AUTORIZO: FASE 0 — documentação [C1–C10]` |
| **Código alterado** | **NENHUM** |
| **Migrations** | **NENHUMA** |
| **Deploy** | **NENHUM** |

## Escopo executado

| Bloco | Descrição | Estado |
|-------|-----------|--------|
| C1 | Normalização FIN (FIN-002–010) | ✅ |
| C2 | Documentação dual path comissão FIN-005 | ✅ |
| C3 | Packs Finance + Legal + STR-001 | ✅ |
| C4 | Pack Governance + Protocolo FASE 0 | ✅ |
| C5 | Pack Compliance (POL/CMP/BCP/DRP/INC/DOC) | ✅ |
| C6 | ADR-027 identidade Founder | ✅ |
| C7 | Beta Charter v2 + scorecard + QA + reuse | ✅ |
| C8 | Growth Architecture paper | ✅ |
| C9 | Templates MIN/INC/Decision/ADVICE spec | ✅ |
| C10 | Master Table 65 IDs + Doc3 table 80 itens | ✅ |

## Garantias não-destruição

Confirmado: **zero** alterações a RBAC, RLS, menus, Pay, comissões (SQL/RPC/UI), Founder Center, Growth funcional.

## Lista exacta de ficheiros

### Criados (24)

1. `docs/master-dossier/README.md`
2. `docs/master-dossier/KUTEKA_MASTER_DOSSIER_INDEX_2026-08-28.md`
3. `docs/master-dossier/finance/C1_FIN_ID_NORMALIZATION_2026-08-28.md`
4. `docs/master-dossier/finance/C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md`
5. `docs/master-dossier/finance/KUT-FIN_PACK_DRAFTS_v0.1.md`
6. `docs/master-dossier/legal/KUT-LEG_PACK_DRAFTS_v0.1.md`
7. `docs/master-dossier/governance/KUT-GOV_PACK_DRAFTS_v0.1.md`
8. `docs/master-dossier/governance/KUT-STR-001_BUSINESS_MODEL_CANVAS_DRAFT_v0.1.md`
9. `docs/master-dossier/compliance/KUT-POL_CMP_BCP_DRP_INC_PACK_v0.1.md`
10. `docs/architecture/ADR-027-founder-institutional-identity.md`
11. `docs/master-dossier/beta/KUTEKA_BETA_CHARTER_v2.md`
12. `docs/master-dossier/beta/KUTEKA_BETA_SCORECARD_v0.1.md`
13. `docs/master-dossier/beta/KUTEKA_BETA_QA_PLAYBOOK_v0.1.md`
14. `docs/master-dossier/beta/KUTEKA_BETA_REUSE_MAP_v0.1.md`
15. `docs/master-dossier/growth/KUTEKA_GROWTH_ARCHITECTURE_PAPER_v0.1.md`
16. `docs/master-dossier/templates/KUT-MIN-2026-001_TEMPLATE.md`
17. `docs/master-dossier/templates/KUT-INC-2026-001_TEMPLATE.md`
18. `docs/master-dossier/templates/KUT-GOV-002_DECISION_REGISTER_TEMPLATE.md`
19. `docs/master-dossier/templates/KUT-ADVICE_REGISTRY_SPEC_v0.1.md`
20. `docs/master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md`
21. `docs/master-dossier/consolidation/KUTEKA_FASE0_DELIVERY_MANIFEST_2026-08-28.md` (este ficheiro)
22. `docs/master-dossier/consolidation/KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md` (cópia actualizada)

### Actualizados / adicionados em product (2)

23. `docs/product/KUTEKA_GOVERNED_INTERPRETATION_REPORT_2026-08-28.md` (untracked → versionado)
24. `docs/product/KUTEKA_KUT_XXX_MASTER_TABLE_2026-08-28.md` (sync com consolidation v1.1)

## Métricas consolidadas

| Conjunto | Contagem |
|----------|----------|
| KUT-XXX Master Table | **65** IDs |
| Doc 3 validation | **80** itens |
| Novos KUT-FIN | FIN-009, FIN-010 |

## Paragem

Fase 0 documental **concluída** (auditoria final 2026-08-28).

| Artefacto | Ficheiro |
|-----------|----------|
| Auditoria final | [`KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md`](./KUTEKA_FASE0_FINAL_AUDIT_REPORT_2026-08-28.md) |
| Handover | [`KUTEKA_FASE0_HANDOVER_2026-08-28.md`](./KUTEKA_FASE0_HANDOVER_2026-08-28.md) |
| Checklist | [`KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md`](./KUTEKA_FASE0_DELIVERY_CHECKLIST_2026-08-28.md) |
| Decisões pendentes | [`KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md`](./KUTEKA_FASE0_PENDING_DECISIONS_2026-08-28.md) |

Publicação GitHub: **pendente** (fora desta execução).

Aguardar `AUTORIZO: FASE 1 — [escopo]` após Founder validar + publicar.
