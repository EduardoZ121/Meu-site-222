# PRD-002 — Parceiro Patrimonial (Ativar Património)

**Versão:** 1.0 · **Estado:** Implementação autorizada (PO 2026-08-01 — desenvolvimento contínuo)  
**Maturidade alvo:** N5  
**Fundação:** PRD-001 N5 · Fase 3 Shell N5 · `PROJECT_BASELINE_PRD001.md`  
**Glossário:** PASSO 0 — _Ativar Património_ (não “publicar anúncio”)

## MVP (âmbitos)

| Inclui                                  | Exclui (fases seguintes)       |
| --------------------------------------- | ------------------------------ |
| Listar patrimónios do utilizador        | Marketplace / pesquisa pública |
| Ativar património (registo)             | Passaporte / SCK / KAI / Score |
| Ver detalhe                             | Upload de documentos / fotos   |
| Estados `draft` · `active` · `archived` | Visitas, propostas, contratos  |
| Gate: papel `patrimonial_partner`       | Nav por papel alternativa      |
| Permissão `properties.manage`           |                                |

## Decisões de produto (ancoradas / assumidas)

| ID  | Decisão                                                                      | Fonte                |
| --- | ---------------------------------------------------------------------------- | -------------------- |
| D1  | Termo oficial: **Ativar Património**                                         | PASSO 0 / AI_CONTEXT |
| D2  | Conta única; exige papel Parceiro Patrimonial para escrever                  | PRD-001              |
| D3  | Shell: item **Patrimónios** passa a activo → `/app/patrimonios`              | Fase 3               |
| D4  | MVP sem documentos/fotos — activação = registo estruturado                   | Âmbito controlado    |
| D5  | Sem Passaporte/KAI/SCK nesta entrega                                         | Baseline auth/shell  |
| D6  | Campos mínimos: título, tipo, finalidade, província, cidade, notas opcionais | Simplicidade MVP     |

**Validação PO só necessária se discordar de D4–D6.** Caso contrário, implementação segue.

## Rotas

| Rota                           | Função                                         |
| ------------------------------ | ---------------------------------------------- |
| `/app/patrimonios`             | Lista                                          |
| `/app/patrimonios/novo`        | Ativar                                         |
| `/app/patrimonios/detalhe?id=` | Detalhe (query — compatível com static export) |

## Dados

Tabela `public.properties` + RLS (dono) + `properties.manage` para `patrimonial_partner` / `administrator`.  
Audit: `property.activated` via `write_audit_log`.
