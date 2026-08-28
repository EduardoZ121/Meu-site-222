# Contas Founder / Gestão Institucional

| Campo          | Valor                                        |
| -------------- | -------------------------------------------- |
| **Sprint**     | Beta 1.6                                     |
| **Migrations** | `0036` → `0039`                              |
| **Identidade** | Sempre `user_id` (UUID) — o email pode mudar |

## Princípio

Founder ≠ Super Admin. O vínculo institucional está em `public.founders` (`user_id`, `is_founder`, `is_owner`). Trocar email **não** quebra permissões. Contas `demo.*` são System Demo — **nunca** para administrar produção.

## Critério visual (não basta existir no código)

1. Conta real → `/app/fundador` → ver `user_id` → Assumir Founder/Owner (se bootstrap aberto).
2. Menu da conta mostra badge **Founder / Owner**.
3. Experiência Superadministrador → `/app/super` → **Gestão Institucional** com tabela Gerir.
4. Centro de Segurança → Alterar email (dupla confirmação).

## 1. Bootstrap do primeiro Founder (único)

**Não** peça ao Cursor para “dar acesso” por mensagem com um UUID. O fluxo correcto:

1. Criar conta Auth **normal** (não `demo.*`) em produção.
2. Iniciar sessão → abrir **`/app/fundador`** (também no menu da conta → Founder / Owner).
3. Confirmar o **user_id** mostrado (UUID permanente).
4. Se `bootstrapOpen = true`, clicar **Assumir como Founder / Owner**.
5. O RPC `founder_bootstrap_claim` grava `user_id` em `founders` com `is_founder` + `is_owner` e atribui `super_administrator`.
6. Bootstrap fica **permanentemente bloqueado**.
7. Se o menu Super ainda não aparecer: sair e voltar a entrar (refresh da sessão de permissões).
8. Mudar experiência para **Superadministrador** → `/app/super` → separador **Gestão Institucional**.

> `/app/fundador` **não** exige `finance.manage` (corrige o chicken-egg do primeiro Owner).

## 2. Depois do login — o que deve aparecer

- Badge Founder / Owner no menu
- Founder Center / KOCC, Gestão Institucional, Super Admin, Admin
- Feature Flags, utilizadores/papéis, finanças autorizadas, auditoria, configs críticas

## 3. Co-Founder

1. O sócio cria conta real e abre `/app/fundador` para copiar o `user_id`.
2. Founder/Owner → Gestão Institucional → **Adicionar Co-Founder / promover**.
3. Colar `user_id`, papel `Co-Founder`, motivo obrigatório → Audit Center.
4. Badge Co-Founder no perfil / permissões.

## 4. Gerir papéis (interface, não SQL)

Tabela: Utilizador · Papel · Estado · user_id · **Gerir**

Em Gerir: alterar papel / promover com motivo. Operações críticas → Audit Center.

## 5. Alterar email do Founder

**Centro de Segurança** (`/app/centro-seguranca`) → Alterar email:

1. Novo email
2. Códigos no email antigo + novo (beta: códigos inline até SMTP)
3. Confirmação → `auth.users.email` actualizado
4. Auditoria completa

```text
user_id = permanente
email = pode mudar
```

## 6. Contas `demo.*`

- `profiles.is_system_demo` / `account_kind = system_demo`
- Testes, vídeos, formação apenas
- **Não** podem ser Founder nem promovidas

## 7. Identidade visual

| Papel           | Cor     |
| --------------- | ------- |
| Founder / Owner | Azul    |
| Co-Founder      | Ciano   |
| Super Admin     | Roxo    |
| Admin           | Verde   |
| Supervisor      | Laranja |
| System Demo     | Cinza   |
