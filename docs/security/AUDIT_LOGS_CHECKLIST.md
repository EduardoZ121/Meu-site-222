# Checklist de segurança — P0 (migration `0002`)

Após aplicar `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql` **no ambiente remoto relevante**:

## Audit logs (P0-2)

- [ ] Policy `audit_logs_insert_authenticated` **não** existe
- [ ] `authenticated` / `anon` **não** têm GRANT INSERT/UPDATE/DELETE em `audit_logs`
- [ ] `write_audit_log` existe e é `security definer`
- [ ] `authenticated` pode `EXECUTE` em `write_audit_log`
- [ ] SELECT próprio continua possível (`audit_logs_select_own`)
- [ ] Código da app usa `writeAuditLog` / RPC — nunca `.from('audit_logs').insert(...)`
- [ ] Tentativa de insert directo com anon key falha (teste manual / SQL)

## RBAC RPCs (P0-1)

- [ ] Existem: `get_user_role_codes`, `get_user_permission_codes`, `user_has_permission`
- [ ] `authenticated` tem `EXECUTE` nas RPCs necessárias
- [ ] App usa `fetchAuthorizationContext` — sem matriz TS de permissions

## Verificação SQL sugerida

```sql
-- RPCs presentes (ajustar se o schema divergir)
select to_regprocedure('public.get_user_role_codes(uuid)');
select to_regprocedure('public.get_user_permission_codes(uuid)');
select to_regprocedure('public.user_has_permission(uuid, text)');
select to_regprocedure('public.write_audit_log(text, text, text, jsonb)');

-- Deve falhar para role authenticated (via teste com JWT de user)
-- insert into public.audit_logs (actor_id, action) values (auth.uid(), 'tamper');

-- Deve funcionar
-- select public.write_audit_log('auth.test', 'user', auth.uid()::text, '{}'::jsonb);
```

Script auxiliar (só leitura/existência): `scripts/verify-p0-migration.sql`.
