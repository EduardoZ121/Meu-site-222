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

> **Roster canónico:** [KUTEKA_INSTITUTIONAL_FOUNDERS_ROSTER_2026-08-29.md](../governance/KUTEKA_INSTITUTIONAL_FOUNDERS_ROSTER_2026-08-29.md) — Founder = **Makiese Vicente**; Co-Founder = **Eduardo**.

### Founder — Makiese Vicente (`vicentemakiese`)

- Decidir D1, D3, D4, D5, D7
- Emitir `AUTORIZO: FASE 1 — [escopo]` quando ready
- Validar entregas advogado/contabilista
- Autoridade estratégica Kuteka (estatuto institucional)

### Co-Founder — Eduardo (`EduardoZ121`)

- Titular contas/repos GitHub (ex.: `EduardoZ121/Site_Angola`)
- Merge PR fork → repo oficial **quando publicado** (acesso técnico GitHub)
- Suporte operacional/técnico; **não** substitui autoridade Founder

### Operacional GitHub (Co-Founder ou delegado)

- Integrations Cursor ↔ GitHub `vicentemakiese` (fork)
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
