# KUT-ADVICE — Registo de Pareceres (spec v0.1)

| Campo | Valor |
|-------|-------|
| **IDs** | KUT-ADVICE-001 a KUT-ADVICE-005 |
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-28 |
| **Estado** | Spec only — **sem schema/UI Fase 0** |

## Objectivo

Registar pareceres profissionais (advogado/contabilista) como fundamento de decisões Pay/comissões/fiscal.

## Campos mínimos (futuro `advice_registry`)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| id | uuid | sim |
| kut_reference | text | sim (ex. ADVICE-001) |
| question | text | sim |
| professional_name | text | sim |
| professional_role | enum | advogado/contabilista |
| recommendation | text | sim |
| conditions | text | não |
| documents | jsonb refs | não |
| status | enum | Validado/Pendente/Rejeitado |
| created_at | timestamptz | sim |
| validated_at | timestamptz | não |

## Itens

| ID | Questão |
|----|---------|
| ADVICE-001 | Kuteka Pay — custódia e enquadramento regulatório |
| ADVICE-002 | Tratamento contabilístico comissões |
| ADVICE-003 | Facturação e documentos fiscais |
| ADVICE-004 | Comissão paga antecipadamente pelo cliente |
| ADVICE-005 | Incentivo comercial 0,5% ao cliente |

## Bloqueio

Activar Pay/comissões **reais** bloqueado até ADVICE-001 + LEG-003 validados.
