# ADR-027 — Identidade institucional Founder / Co-Founder

| Campo | Valor |
|-------|-------|
| **Status** | Accepted (Fase 0 — preparação) |
| **Date** | 2026-08-28 |
| **Deciders** | Founder |
| **Relates** | ADR-026 (Security Center), `0036` founders, Doc 3 §29 |
| **Implementação** | **AGORA:** auditar compatibilidade. **FUTURO:** fluxo alteração email |

## Context

A Kuteka deve continuar a funcionar independentemente do email pessoal dos fundadores. O estatuto **Founder** e **Co-Founder** é institucional e permanente; o email é meio de autenticação substituível.

**Regra crítica (Founder):** Esta separação **não** reconstrói, substitui ou altera a hierarquia operacional existente:

```
Founder / Co-Founder → Super Admin → Admin → Supervisor → Agente → Prestador/Parceiro → Cliente
```

## Decision

### 1. Fonte institucional

- Tabela `public.founders` com `user_id` como relação principal
- `is_founder`, `is_owner` (Co-Founder/Owner semantics), `display_label`
- **Proibido** usar email como chave de autorização (`if email === 'founder@...'`)

### 2. Permissões

Determinadas por: `user_id`, `founders`, papéis RBAC, RLS, backend — **nunca** email.

### 3. Alteração de dados institucionais

| Actor | Pode alterar |
|-------|--------------|
| Founder | Apenas **próprios** dados (futuro: email via Security Center) |
| Co-Founder | Apenas **próprios** dados |
| Super Admin | **Não** email/identidade institucional de fundadores |
| Qualquer outro | **Bloqueado** |

Founder **não** edita Co-Founder (e vice-versa) via UI normal. Excepções = procedimento institucional + audit + possível intervenção legal.

### 4. Alteração de email (FUTURO — não activar Fase 0)

Fluxo alvo (ADR-026 + §29.7):

```
Founder → Centro Segurança → Alterar email → Reauth → Novo email → Confirmar → Auth update → Audit
```

Requisitos: email válido/disponível, sessão autenticada, recovery method, confirmação old/new, evento audit imutável.

### 5. O que NÃO fazer agora

- CEO, Chairman, Board, sucessão automática, herança permissões
- Alterar RLS/menus/Founder Center/RBAC para “preparar” sucessão
- Substituir tabela `founders` destructivamente

### 6. Estado actual plataforma (auditoria Fase 0)

| Requisito | Estado |
|-----------|--------|
| `founders.user_id` | 🟢 `0036`, `0040` |
| RBAC por user_id | 🟢 |
| Security Center OTP | 🟡 ADR-026 |
| Fluxo email change completo | 🟡 preparado, não activado |
| Testes §29.12 | 🔴 plano documentado |

## Consequences

- Emails podem mudar sem perder estatuto Founder/Co-Founder **quando** fluxo activado
- Documentação Master Dossier referencia ADR-027 permanentemente
- Implementação código = fase separada com `AUTORIZO` + testes 29.12

## Testes obrigatórios (antes de activar email change)

1. Founder muda email → continua Founder
2. Co-Founder muda email → continua Co-Founder
3. Super tenta alterar email Founder → bloqueado
4. Admin tenta → bloqueado
5. Terceiro tenta modificar Co-Founder → bloqueado
6. Pós-mudança: permissões, histórico, auditoria, Founder Center intactos

## References

- Doc 3 §29 (prompt definitivo identidade)
- [`docs/master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md`](../master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md)
- `supabase/migrations/0036_trust_governance_gate.sql`
