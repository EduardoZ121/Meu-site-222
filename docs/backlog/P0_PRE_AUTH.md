# Backlog P0 — Pré-requisitos do PRD-001 (Authentication)

**Estado:** P0-1/P0-2 aprovados · Encerramento oficial **após activação CI**  
**Branch:** `cursor/p0-pre-auth-f96b`  
**Relatório:** `docs/backlog/P0_COMPLETION_REPORT.md`  
**Runbook:** `docs/backlog/P0_ACTIVATION_RUNBOOK.md`  
**ADR:** `docs/architecture/ADR-003-p0-pre-auth-hardening.md`

---

## P0-1 — Fonte única de verdade do RBAC

**Critérios de conclusão:**

- [x] Não existe matriz de autorização mantida à mão em paralelo da BD
- [x] Sessão/autorização resolve permissions a partir da fonte oficial
- [x] Testes cobrem papéis multi-role e `admin.panel`
- [x] Documentação / ADR actualizado
- [x] **Aprovação técnica de produto (2026-07-29)**

---

## P0-2 — Integridade de `audit_logs`

**Critérios de conclusão:**

- [x] Utilizadores autenticados não podem inserir/alterar `audit_logs` directamente
- [x] Existe API/função server-side controlada para eventos auditáveis
- [x] Migration + testes/checklist de segurança
- [x] Documentação actualizada
- [x] **Aprovação técnica de produto (2026-07-29)**

---

## P0-3 — CI activo em `.github/workflows/`

**Critérios de conclusão:**

- [x] Definição oficial pronta (`docs/engineering/github-workflows/ci.yml` + `scripts/enable-github-ci.sh`)
- [ ] Ficheiro activo em `.github/workflows/ci.yml` (requer push com scope `workflow`)
- [ ] Pipeline verde na branch (após activação)
- [x] Documentação do workflow actualizada

---

## Relação com fases

| Fase                           | Relação com P0                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Landing Page                   | Encerrada                                                                                                               |
| PRD-001 Authentication         | **Aprovação Funcional** já concedida (v1.0). **Código** só após Engineering Gate (P1+P2) + Autorização de Implementação |
| Fluxos autenticados de negócio | Após implementação autorizada do PRD-001                                                                                |

Gate: `docs/backlog/PRD_001_ENGINEERING_GATE.md`
