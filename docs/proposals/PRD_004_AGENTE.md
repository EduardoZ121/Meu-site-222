# PRD-004 — Agente Certificado

**Versão:** 1.0 · **Estado:** Implementação autorizada (PO 2026-08-01 — contínuo pós UX Shell)  
**Maturidade alvo:** N5  
**Fundação:** Auth · Shell · PRD-002 · PRD-003  
**Glossário:** PASSO 0 — **Agente Certificado** · verbo MVP **Activar Acompanhamento**

## MVP (âmbitos)

| Inclui                                     | Exclui                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Hub Agente + preferências leves            | Passaporte / KAI / Academia / Ranking                |
| Explorar patrimónios `active`              | Visitas, propostas, contratos, comissões             |
| Activar / listar acompanhamentos           | Self-serve do papel (continua atribuído pela Kuteka) |
| Detalhe só-leitura (sem notas do parceiro) | Marketplace público / Confiança                      |

## Decisões (assumidas)

| ID  | Decisão                                                     |
| --- | ----------------------------------------------------------- |
| D1  | UI = **Agente** (`modules/agente`)                          |
| D2  | Papel `certified_agent` **não** self-serve                  |
| D3  | Shell: Agente activo → `/app/agente`                        |
| D4  | Discovery via `agent.operate` + RLS em patrimónios `active` |
| D5  | Preferências: finalidade, província, cidade                 |
| D6  | Sem Passaporte / KAI / visitas nesta entrega                |

## Rotas

| Rota                      | Função                                        |
| ------------------------- | --------------------------------------------- |
| `/app/agente`             | Hub + preferências + lista de acompanhamentos |
| `/app/agente/explorar`    | Discovery                                     |
| `/app/agente/detalhe?id=` | Detalhe património + activar acompanhamento   |

## Dados

- Permissão `agent.operate` → `certified_agent` + `administrator`
- `agent_preferences`, `agent_assignments` + RLS
- Audit: `agent.assignment_activated`
