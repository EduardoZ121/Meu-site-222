# Code Review Checklist (KEOS)

**Processo:** `docs/engineering/DEVELOPMENT_PROCESS.md` · **Índice:** `docs/README.md`

## Antes de rever código de um módulo

- [ ] O PRD do módulo tem **Aprovação Funcional**
- [ ] **Engineering Gate** verde (quando aplicável)
- [ ] **Autorização de Implementação** (Fase 2) emitida — senão, o PR não deve existir

## Checklist técnica

- [ ] Alinhado a ADR-001+ / AI_CONTEXT / PRD oficial do módulo
- [ ] Sem regras de negócio no Design System (`@kuteka/ui`)
- [ ] Autorização por permissão (`canX`), não `role === …` no cliente
- [ ] Sem secrets no código
- [ ] TypeScript strict sem `any` injustificado
- [ ] Logs sem PII / tokens
- [ ] Testes para lógica crítica (RBAC, validation, utils, allowlist `next` se auth)
- [ ] Conventional Commit na mensagem
- [ ] Sem expectativa visual Passaporte/KAI/SCK fora do PRD respectivo
- [ ] A11y básica (teclado, labels) em UI nova
