# PRD-008 — Contratos

**Versão:** 1.0 · **Estado:** Implementação autorizada (primeira expansão pós-Core)  
**Maturidade alvo:** N5  
**Fundação:** Platform Core v1.0 congelado · Confiança · Administração · Habitação

## Posição no fluxo

Confiança → Administração → **Contrato** → Pagamento → Conclusão.

## MVP

| Inclui                                                             | Exclui                                         |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| Hub Contratos com lista real, demo e CTA de criação                | Assinatura digital qualificada / notário       |
| Tabela `property_contracts` com partes, valor, termos e estados    | Pagamentos reais / wallet / split de comissões |
| RPCs para criar, aceitar, cancelar e concluir contratos            | Marketplace jurídico / conservatória integrada |
| RLS por partes + admin; demo visível para `contracts.manage`       | Templates avançados ou edição colaborativa     |
| Rotas `/app/contratos`, `/novo`, `/detalhe?id=` static-export safe | Página própria de Pagamentos                   |

## Decisões

| ID  | Decisão                                                                                 |
| --- | --------------------------------------------------------------------------------------- |
| D1  | Permissão `contracts.manage` para Cliente, Parceiro, Agente Certificado e Administrador |
| D2  | Parceiro/Admin criam contratos; transições ocorrem via RPCs `SECURITY DEFINER`          |
| D3  | Estados MVP: `draft`, `pending_acceptance`, `active`, `completed`, `cancelled`          |
| D4  | `purpose` do contrato é apenas `rent` ou `sale`; património `both` pode originar ambos  |
| D5  | Pagamentos permanece como próxima expansão; CTA aponta para `/app` com copy explícita   |
| D6  | Detalhe usa `?id=` para manter compatibilidade com static export                        |

## Rotas

| Rota                         | Função                               |
| ---------------------------- | ------------------------------------ |
| `/app/contratos`             | Hub + lista + demo + CTA             |
| `/app/contratos/novo`        | Preparar contrato                    |
| `/app/contratos/detalhe?id=` | Detalhe, partes, termos e transições |

## Dados demo

Migration `0011_contracts_prd008.sql` cria três contratos `KTK-CTR-0001..0003` ligados a patrimónios `KTK-DEMO` e a identidades demo, com `is_demo=true`.
