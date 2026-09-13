# Governed Development Protocol — FASE 0

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **ID** | KUT-GOV-PROTO-001 |
| **Estado** | Activo |

## Fluxo obrigatório

```
INTERPRETAR → AUDITAR → VALIDAR (Founder) → AUTORIZAR POR FASE → EXECUTAR → TESTAR → REPORTAR
```

## Papéis

| Papel | Responsabilidade |
|-------|------------------|
| **Founder** | Valida interpretação; autoriza fases; decide comercial/jurídico/fiscal |
| **Cursor/Engenharia** | Executor técnico; não decide modelo de negócio |
| **Advogado/Contabilista** | Valida instrumentos LEG/FIN/CMP |

## Formato de autorização

```
AUTORIZO: FASE X — [escopo exacto]
```

## Formato de correcção

```
CORRECÇÃO DO FOUNDER — ITEM KUT-XXX
Interpretação: ...
Classificação: A|B|C|D|E
Prioridade: P0|P1|P2
```

## Classificação A/B/C/D/E

| Class | Significado |
|-------|-------------|
| A | Reutilizar existente |
| B | Modificar existente |
| C | Criar novo |
| D | Aguardar decisão Founder/especialista |
| E | Não implementar nesta fase |

## Princípio de não-destruição

Sem autorização explícita, **proibido** alterar: RBAC, RLS, menus, pagamentos, comissões, Founder Center, funcionalidades 🟢 existentes.

## Fases

| Fase | Conteúdo | Estado 2026-08-28 |
|------|----------|-------------------|
| 0 | Documentação C1–C10 | **AUTORIZADO** |
| 1+ | Implementação | Bloqueado até autorização |

---

# KUT-GOV-001 — Governance Framework (DRAFT v0.1)

## Hierarquia operacional (inalterada)

```
Founder / Co-Founder → Super Admin → Admin → Supervisor → Agente → Prestador/Parceiro → Cliente
```

## Separação conceptual

| Conceito | Definição Kuteka |
|----------|------------------|
| **Estatuto institucional** | `founders.user_id` — Founder/Co-Founder |
| **Papel operacional** | RBAC role codes — permissões actuais |
| **Delegação** | Futuro — overlay temporal (não implementado) |

## Fontes de verdade

- RBAC: `role-experience.ts`, migrations `0037`, `0040`
- Fundadores: tabela `founders`
- Matriz ops: [`ROLE_OPERATING_MATRIX.md`](../../product/ROLE_OPERATING_MATRIX.md)

## Decisões estratégicas

Registo futuro: KUT-GOV-002 Decision Register (template em templates/)

---

# KUT-GOV-003 — RACI Matrix (DRAFT v0.1)

Ver também KUT-FIN-003 para domínio financeiro.

| Processo | Founder | Co-Founder | Super | Admin | Supervisor |
|----------|---------|------------|-------|-------|------------|
| Comissão activação 35% | **A/R** | C | I | — | — |
| Aprovar publicação imóvel | I | I | **A** | C | **R** |
| Escalação crítica | **A** | C | **R** | C | R |
| Alterar email Founder | **R** (próprio) | **R** (próprio) | — | — | — |
| KOCC module status | **A** | C | **R** | — | — |
| Feedback Beta triagem | I | I | **A** | C | C |

**Legenda:** R=Responsible, A=Accountable, C=Consulted, I=Informed

---

# KUT-GOV-004 — Meeting & Minutes Policy (DRAFT v0.1)

1. Reuniões institucionais (Founder, contabilista, advogado) devem gerar ata
2. Template: [KUT-MIN-2026-001](../templates/KUT-MIN-2026-001_TEMPLATE.md)
3. Atas versionadas no Legal Pack (DOC-001)
4. Decisões estratégicas → Decision Register

---

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1 | 2026-08-28 | Fase 0 governance pack |
