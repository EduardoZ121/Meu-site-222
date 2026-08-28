# PRD-001 — Inventário de content (i18n-ready)

**Estado:** Preparação documental · **Não** ligar à app até activação do Implementation Readiness Pack  
**Fonte:** `PRD_001_AUTHENTICATION_SPEC.md` §18 (wireframes) + copy F1–F6  
**Locale MVP:** `pt-AO` (D9) · chaves reservadas para `en` sem UI EN no MVP

Este inventário acelera a implementação sem alterar decisões de negócio. Qualquer conflito com §15.5 R1–R12 → prevalece o PRD.

---

## Convenção de chaves

`auth.<fluxo>.<elemento>` — ex.: `auth.register.title`

---

## Marca (todas as páginas auth)

| Chave             | pt-AO (MVP) |
| ----------------- | ----------- |
| `auth.brand.name` | Kuteka      |

---

## F1 — Registo (`/auth/registar`)

| Chave                                | pt-AO (MVP)                                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `auth.register.title`                | Criar conta                                                                                                |
| `auth.register.subtitle`             | Crie a sua conta Kuteka e comece a gerir, encontrar e valorizar patrimónios com segurança e transparência. |
| `auth.register.email.label`          | Email                                                                                                      |
| `auth.register.email.hint`           | O seu email protege a conta e permite recuperar o acesso.                                                  |
| `auth.register.password.label`       | Password                                                                                                   |
| `auth.register.password.rule.min`    | Pelo menos 8 caracteres                                                                                    |
| `auth.register.password.rule.upper`  | Uma letra maiúscula                                                                                        |
| `auth.register.password.rule.number` | Um número                                                                                                  |
| `auth.register.confirm.label`        | Confirmar password                                                                                         |
| `auth.register.terms.label`          | Termos                                                                                                     |
| `auth.register.submit`               | Criar conta                                                                                                |
| `auth.register.cta.login`            | Já tem conta? Entrar                                                                                       |
| `auth.register.duplicate.login`      | Entrar                                                                                                     |
| `auth.register.duplicate.recover`    | Recuperar acesso                                                                                           |

---

## F2 — Verificar email (`/auth/verificar`)

| Chave                       | pt-AO (MVP)                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `auth.verify.title`         | Verifique o seu email                                                                                       |
| `auth.verify.subtitle`      | Estamos quase lá. Só precisamos confirmar que este email pertence realmente a si para proteger a sua conta. |
| `auth.verify.resend`        | Reenviar email                                                                                              |
| `auth.verify.confirming`    | Estamos a confirmar a sua conta…                                                                            |
| `auth.verify.already.title` | A sua conta já se encontra confirmada.                                                                      |
| `auth.verify.already.cta`   | Entrar na Kuteka                                                                                            |

---

## F3 — Entrar (`/auth/entrar`)

| Chave                       | pt-AO (MVP)                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `auth.login.title`          | Entrar                                                                                   |
| `auth.login.subtitle`       | Regresse ao seu espaço na Kuteka.                                                        |
| `auth.login.email.label`    | Email                                                                                    |
| `auth.login.password.label` | Password                                                                                 |
| `auth.login.password.show`  | Mostrar                                                                                  |
| `auth.login.submit`         | Entrar                                                                                   |
| `auth.login.cta.register`   | Criar conta                                                                              |
| `auth.login.cta.recover`    | Esqueceu a password?                                                                     |
| `auth.login.error.generic`  | Não foi possível entrar. Verifique os dados e tente novamente. _(ajustar sem enum — R6)_ |

---

## F4 — Logout

| Chave              | Nota                                       |
| ------------------ | ------------------------------------------ |
| `auth.logout.done` | Redirect Landing ou login conforme F4 / R1 |

---

## F5 — Recuperar (`/auth/recuperar`, `/auth/recuperar/confirmar`)

| Chave                           | pt-AO (MVP)                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| `auth.recover.request.title`    | Recuperar acesso                                                      |
| `auth.recover.request.subtitle` | Não se preocupe. Vamos ajudá-lo a recuperar o acesso de forma segura. |
| `auth.recover.request.submit`   | Enviar instruções                                                     |
| `auth.recover.request.back`     | Voltar a Entrar                                                       |
| `auth.recover.request.noemail`  | Sem acesso ao email? Contacto                                         |
| `auth.recover.request.success`  | Se existir uma conta com este email, enviámos instruções. _(R6)_      |
| `auth.recover.confirm.title`    | Nova password                                                         |
| `auth.recover.confirm.submit`   | Guardar                                                               |

---

## F6 — Onboarding

| Chave                            | Nota                                          |
| -------------------------------- | --------------------------------------------- |
| `auth.onboarding.roles.title`    | Activação de papéis self-serve (§18.7 / §6.6) |
| `auth.onboarding.roles.client`   | Cliente                                       |
| `auth.onboarding.roles.partner`  | Parceiro Patrimonial                          |
| `auth.onboarding.roles.submit`   | Continuar                                     |
| `auth.onboarding.profile.title`  | Nome de apresentação (se necessário)          |
| `auth.onboarding.profile.submit` | Continuar                                     |

**Proibido na UI F6:** `certified_agent`, `administrator` (D4 / §16.5).

---

## Eventos de audit (códigos — não copy de UI)

Ver PRD §13. Usar exactamente estes `action` strings com `write_audit_log`.

---

## Checklist de implementação do content

- [ ] Ficheiro `content/pt.ts` (ou equivalente) no módulo authentication
- [ ] Nenhuma string hard-coded nos componentes de fluxo
- [ ] Tom alinhado a PASSO 0 / confiança / simplicidade
- [ ] Erros R6 sem enumeração de contas
