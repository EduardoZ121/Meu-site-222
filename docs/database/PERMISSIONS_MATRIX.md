# Matriz inicial de permissões

**Fonte de verdade:** tabelas PostgreSQL (`roles`, `permissions`, `role_permissions`)  
**Seed base:** `supabase/seed/0001_roles.sql` (`platform.access`, `admin.panel`)  
**Permissões de domínio:** migrations `0004`–`0011` (properties, housing, agent, admin, trust, contracts)
**Resolução runtime:** `get_user_permission_codes(user_id)` (`0002`, scoped self/admin em `0010`)  
**App:** `@kuteka/auth` só avalia arrays já resolvidos — **sem** matriz TypeScript paralela.  
**Nav Core v1.0:** módulos gated por estas permissões (excepto Agente, visível para demo).

| Permissão           | client | patrimonial_partner | certified_agent | administrator |
| ------------------- | ------ | ------------------- | --------------- | ------------- |
| `platform.access`   | ✓      | ✓                   | ✓               | ✓             |
| `admin.panel`       |        |                     |                 | ✓             |
| `properties.manage` |        | ✓                   |                 | ✓             |
| `housing.explore`   | ✓      |                     |                 | ✓             |
| `agent.operate`     |        |                     | ✓               | ✓             |
| `trust.manage`      | ✓      | ✓                   | ✓               | ✓             |
| `contracts.manage`  | ✓      | ✓                   | ✓               | ✓             |

Novos papéis / permissões = novos rows + seed/migration — sem alterar o modelo RBAC.
