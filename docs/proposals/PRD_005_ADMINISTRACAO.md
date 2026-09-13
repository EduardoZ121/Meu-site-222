# PRD-005 — Administração

**Versão:** 1.0 · **Estado:** Implementação autorizada (PO 2026-08-01 — contínuo pós UX polish)  
**Maturidade alvo:** N5  
**Fundação:** Auth · Shell · PRD-002…004 · `admin.panel`

## MVP

| Inclui                                   | Exclui                             |
| ---------------------------------------- | ---------------------------------- |
| Hub Administração + resumo da plataforma | Passaporte / KAI / BI / Wallet     |
| Lista de utilizadores + papéis (leitura) | CRUD completo de utilizadores      |
| Atribuir papel `certified_agent`         | Self-serve de agente/admin         |
| Gate `admin.panel`                       | Moderação marketplace / audit dump |

## Decisões

| ID  | Decisão                                                   |
| --- | --------------------------------------------------------- |
| D1  | UI = **Administração** (`modules/administracao`)          |
| D2  | Agente/Admin continuam **não** self-serve                 |
| D3  | Shell já aponta para `/app/admin`                         |
| D4  | Leitura alargada + RPC de atribuição com `admin.panel`    |
| D5  | Resumo: contagens de contas, patrimónios, acompanhamentos |
| D6  | Sem Passaporte / KAI nesta entrega                        |

## Rotas

| Rota                      | Função                              |
| ------------------------- | ----------------------------------- |
| `/app/admin`              | Hub + resumo                        |
| `/app/admin/utilizadores` | Lista + atribuir Agente Certificado |
