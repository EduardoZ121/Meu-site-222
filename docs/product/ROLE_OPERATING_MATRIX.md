# Matriz Oficial de Papéis e Responsabilidades — Kuteka

| Campo        | Valor                                             |
| ------------ | ------------------------------------------------- |
| **Fonte UI** | `apps/web/modules/shell/role-operating-matrix.ts` |
| **Sprint**   | Beta 1.6 (gate visual / operacional)              |

Esta matriz é a **fonte oficial da experiência operacional**. RBAC/RLS continua na base; o cockpit (`/app`) segue a missão do papel activo.

## Auditoria (código ≠ concluído)

| Papel       | Dashboard                  | Menu                  | Tarefas home                                                     | Ações                    | Permissões                      | Limitações          | Estado           |
| ----------- | -------------------------- | --------------------- | ---------------------------------------------------------------- | ------------------------ | ------------------------------- | ------------------- | ---------------- |
| Founder     | Super + `/app/fundador`    | Badge + guia          | Super/KOCC/Institucional                                         | Bootstrap, promover      | via Super + founders            | ≠ demo              | **parcial**      |
| Co-Founder  | Super (configurável)       | Badge                 | Super                                                            | Promoção pelo Owner      | co_founder + Super se promovido | ≠ remover Owner     | **parcial**      |
| Super Admin | AdminOps executive + Super | Admin + Super         | **Centro de Comando / Central Trabalho / KOCC** (não Activar PP) | Fila, KOCC, flags        | finance + review                | ≠ Activar como PP   | **corrigido UI** |
| Admin       | Central Trabalho           | Admin                 | Fila, utilizadores, KYC                                          | Aprovar/rejeitar         | admin + review                  | ≠ comissões         | **corrigido UI** |
| Supervisor  | Central Trabalho           | Admin                 | Fila, SLA                                                        | Pendenciar, contactar PP | review (sem approve)            | ≠ aprovar/rejeitar  | **parcial**      |
| Agente      | AgentOps                   | Agente                | Pipeline                                                         | Visitas / CRM            | agent.operate                   | ≠ aprovar           | **conforme**     |
| Prestador   | —                          | —                     | —                                                                | `/app/servicos`          | services.operate                | Sem experience mode | **falta**        |
| Parceiro    | PartnerOps                 | Patrimónios + Activar | Activar património                                               | Registo / docs           | properties.manage               | ≠ auto-aprovar      | **conforme**     |
| Cliente     | ClientOps + Feed           | Explorar / Favoritos  | Explorar                                                         | Social / contratos       | housing.explore                 | ≠ ops admin         | **conforme**     |

## Regra do cockpit

CTAs de `/app` vêm de `ROLE_OPERATING_MATRIX[mode].homeCtas`, **não** de “tem permissão X ⇒ botão Y”.

Exemplo Super Admin:

1. Centro de Comando Super
2. Central de Trabalho
3. KOCC
4. Founder / Gestão Institucional
5. Centro de Segurança

**Não** “Activar Património” nem “Explorar Habitação” como tarefa principal.

## Governação

```text
FOUNDER / OWNER
  → CO-FOUNDER / BOARD
    → SUPER ADMIN
      → ADMIN
        → SUPERVISOR
          → AGENTE / PRESTADOR / PARCEIRO
            → CLIENTE
KAI = transversal (recomenda; humano decide)
```

## Backlog (não bloqueia este fix)

- Experience mode dedicado `founder` / `service_provider`
- Prestador cockpit completo
- Board / Investor read-only UI
