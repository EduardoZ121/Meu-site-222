# ADR-012 — Contratos como primeira expansão pós-Core

**Data:** 2026-08-01  
**Estado:** Aceite  
**Contexto:** Platform Core v1.0 está congelado; novos módulos devem ser aditivos e preservar padrões Premium Experience.

## Decisão

Implementar Contratos como módulo isolado em `apps/web/modules/contratos`, protegido por `contracts.manage`, com persistência em `property_contracts` e transições via RPCs `SECURITY DEFINER`.

## Consequências

- Core permanece intacto; alterações são aditivas em RBAC, shell, docs e módulo web.
- RLS permite leitura apenas a partes/admin, com excepção demo para utilizadores com `contracts.manage`.
- Criação é limitada a Parceiro Patrimonial ou Administrador; Cliente aceita; partes/admin cancelam; Parceiro/Agente/Admin concluem.
- Pagamentos fica fora do escopo PRD-008, mas todos os CTAs apontam para o próximo passo sem beco sem saída.
- Detalhe usa `?id=` para manter static export seguro.

## Alternativas rejeitadas

| Alternativa                                     | Motivo                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| Inserir contratos directamente pelo cliente web | Estados ficariam expostos a update directo via RLS     |
| Criar módulo Pagamentos stub separado           | Criaria superfície de produto sem PRD e sem backend    |
| Reutilizar `property_interests` como contrato   | Mistura intenção comercial com formalização contratual |
