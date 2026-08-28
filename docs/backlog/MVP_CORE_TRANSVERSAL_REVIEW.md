# Revisão transversal — núcleo MVP

**Data:** 2026-08-01  
**Âmbito:** Auth · Shell · Patrimónios · Habitação · Agente · Administração · Confiança

## Verificações

| Área         | Acção                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Navegação    | Todos os módulos de produto activos; Admin gated por `admin.panel`    |
| Home `/app`  | Confiança activa; quick action «Verificar conta» com `trust.manage`   |
| Permissões   | Matriz alinhada a `trust.manage` + RPCs existentes                    |
| Empty states | Padrão `EmptyState` + `ModuleSkeleton` nos hubs                       |
| Stub órfão   | Removido `AdminPanelClient` (substituído pelo hub PRD-005)            |
| Copy         | README rotas `(app)` actualizado; «Em desenvolvimento» só se residual |

## Resultado

Núcleo MVP estabilizado para utilização. Módulos avançados (Contratos, Wallet, Marketplace, KAI, BI) só após aprovação PO.
