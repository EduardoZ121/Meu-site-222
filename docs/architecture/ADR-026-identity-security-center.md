# ADR-026 — Centro de Identidade e Segurança (Auth Security Core)

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Product Owner · Engineering
- **Relates:** ADR-003 (pre-auth), ADR-004 (auth), ADR-025 (KIS), PRD-001

## Context

Kuteka aims to operate as a **financial / patrimonial platform**, not a classifieds portal. Authentication must evolve from “confirm email somehow” into a durable **Identity & Security Center**: dual email confirmation (link + OTP), SMS OTP (Angola-ready providers), sensitive-change step-up, session/device governance, and Super Admin hardening — without rebuilding Auth later.

Today: UI for link-based verification exists; SMTP/confirmations are partial in production; phone OTP and 2FA are not operational.

## Decision

### Dual email confirmation (always both)

| Method                              | Channel                           | UX                       |
| ----------------------------------- | --------------------------------- | ------------------------ |
| **A — Link**                        | Supabase Auth email               | Click link → confirmed   |
| **B — OTP (preferential fallback)** | 6-digit code in `/auth/verificar` | Enter code → `verifyOtp` |

Users who cannot open the link use the code. Product never picks only one method.

### Phone verification

Architecture ready from day one:

`phone → send OTP → enter code → phone_verified_at`

Provider interface: `SmsOtpProvider` with **sandbox** implementation now; swap to Twilio / MessageBird / Infobip (Angola) later without schema rewrite.

### Account recovery

Same OTP core: recover by **email**, **phone**, or **both** (step-up), then set new password.

### Sensitive change step-up

Changing email, phone, password, ID document, or banking requires a fresh OTP challenge (`purpose = sensitive_change`).

### Prepared (schema + UI stubs; feature flags off until activated)

- TOTP / 2FA factors
- Recovery codes (hashed)
- Trusted devices + session inventory
- Remote session revoke
- Security notification events

### Centro de Segurança (`/app/centro-seguranca`)

Single dashboard: email/phone verified, KYC, last login, devices, sessions, recent changes, recovery history, auth history, account security score.

### Super Administrators

Must meet at least: email verified + phone verified; 2FA when flag `security.mfa_required_for_admin` is on. Password alone is never enough for elevated ops.

### Phased delivery

1. **Ops:** SMTP production, confirm email on, autoconfirm off
2. **App:** Email OTP 6 digits + keep link
3. **App:** SMS OTP (sandbox → real provider)
4. **App:** Centro de Segurança
5. **Infra ready:** 2FA, devices, session revoke (activate later)

## Consequences

- Migration `0030_identity_security_center.sql` introduces challenges, devices, sessions audit, recovery codes, notification intents, and `get_security_center_snapshot`.
- Supabase Dashboard must enable Email OTP / SMTP (Phase 1 ops checklist in this ADR appendix).
- KIS (ADR-025) remains the juridical identity source; this ADR owns **authentication security**.

## Appendix — Phase 1 ops checklist (Supabase project)

1. Authentication → Providers → Email → **Confirm email = ON**
2. Disable autoconfirm / “Enable email confirmations” consistent with production
3. Custom SMTP (Resend / SES / SendGrid) + Kuteka-branded templates (Confirm + Reset)
4. URL config: Site URL `https://kutekalink.com`, redirect allow-list
5. Enable Email OTP (6-digit) alongside magic link if available in project settings
6. Smoke-test: register real inbox → receive link **and** code → both paths confirm

## References

- `supabase/migrations/0030_identity_security_center.sql`
- `apps/web/modules/authentication/**` · `apps/web/modules/seguranca/**`
- `docs/product/KUTEKA_ROADMAP_MASTER.md`
