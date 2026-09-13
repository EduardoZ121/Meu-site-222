# PRD-009 — Identidade Real (KYC)

## Objectivo

Identidade verificada para alimentar contratos, propostas, facturas e confiança — não apenas um nome de utilizador.

## Secções do perfil

A. Identidade pessoal · B. Documento (frente/verso) · C. Fotografia · D. Contactos · E. Endereço · F. Bancário (opcional) · G. Painel de verificação + Índice de Confiança

## Níveis

| Nível | Critério                               |
| ----- | -------------------------------------- |
| 0     | Conta criada                           |
| 1     | Email (e telefone quando confirmado)   |
| 2     | Documento validado                     |
| 3     | Identidade + morada                    |
| 4     | Premium (morada verificada + bancário) |

## Gates

Obrigatório para clientes (arrendar/comprar), parceiros, agentes, prestadores, admin/super-admin em acções de contrato/pagamento/visita. Navegação livre para visitantes.

## Entrega v1

- Migration `0018_identity_kyc.sql`
- UI `/app/perfil`
- RPCs snapshot/export/recompute
- Ligação Confiança + gate em `create_property_contract`
