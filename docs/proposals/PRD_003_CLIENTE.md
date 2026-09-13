# PRD-003 — Cliente (Habitação)

**Versão:** 1.0 · **Estado:** Implementação autorizada (PO 2026-08-01)  
**Maturidade alvo:** N5  
**Fundação:** PRD-001 · Shell · PRD-002 (patrimónios activos)  
**Glossário:** PASSO 0 — domínio **Habitação** (jornada do Cliente)

## MVP (âmbitos)

| Inclui                                     | Exclui (fases seguintes)         |
| ------------------------------------------ | -------------------------------- |
| Hub Habitação + preferências leves         | Passaporte / KAI / Confiança     |
| Explorar patrimónios `active`              | Visitas, propostas, contratos    |
| Detalhe só-leitura (sem notas do parceiro) | Favoritos, mensagens, pagamentos |
| Gate: papel `client` + `housing.explore`   | Marketplace público / anúncios   |
| Complementa inventário do PRD-002          | Upload documentos / Score        |

## Decisões de produto (ancoradas / assumidas)

| ID  | Decisão                                                        | Fonte               |
| --- | -------------------------------------------------------------- | ------------------- |
| D1  | Superfície UI = **Habitação** (não pasta `client`)             | PASSO 0             |
| D2  | Conta única; escrita de preferências exige papel Cliente       | PRD-001             |
| D3  | Shell: **Habitação** activo → `/app/habitacao`                 | Fase 3              |
| D4  | Discovery só de patrimónios `active` (RLS + `housing.explore`) | Complemento PRD-002 |
| D5  | Preferências MVP: finalidade, província, cidade                | Simplicidade        |
| D6  | Sem Passaporte / KAI / Confiança / visitas nesta entrega       | Roadmap             |

**Validação PO só necessária se discordar de D4–D6.** Caso contrário, implementação segue.

## Rotas

| Rota                         | Função                       |
| ---------------------------- | ---------------------------- |
| `/app/habitacao`             | Hub + preferências           |
| `/app/habitacao/explorar`    | Lista discovery              |
| `/app/habitacao/detalhe?id=` | Detalhe (static-export safe) |

## Dados

- Permissão `housing.explore` → `client` + `administrator`
- RLS SELECT em `properties` para discovery (`status = active`)
- Tabela `client_preferences` (1 linha / utilizador)
- Audit best-effort: `housing.preferences_saved`
