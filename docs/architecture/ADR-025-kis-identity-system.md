# ADR-025 — KIS (Kuteka Identity System)

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Product Owner · Engineering
- **Relates:** ADR-014 (Identity KYC), ADR-012 (Contracts), ADR-018 (Kuteka Pay)

## Context

Before Kuteka v1.0 Beta with real users, the platform needs a **transversal identity core** — not only a profile page. Contracts, payments, marketplace, D1–D5 services, PDK, KAI, CRM and audit must consume one juridical identity source (KIS) without re-asking for the same fields.

ADR-014 delivered the KYC 0–4 schema and `/app/perfil`. KIS elevates that into an **operating system for identity**: guided onboarding, UTS, gates, history, and document audit.

## Decision

1. **KIS is the single source of personal / ID / address / banking data** for the platform. New modules must call `get_identity_party_snapshot` (or load KIS fields) — never invent parallel forms.
2. **UX:** digital-bank style multi-step wizard on `/app/perfil` (save & continue, progress %, next-step assistant).
3. **Centro de Confiança** (`/app/centro-confianca`) — human-readable trust dashboard (account state, pillars, UTS, next step). KAI reads the same model to suggest unlocks on the home feed.
4. **UTS** = `profiles.trust_index` (0–100); `kis_completeness` drives the assistant %.
5. **KYC levels 0–4** remain the product levels; visible in UI and snapshots.
6. **Commercial gates:** `assert_actor_meets_kyc(2)` on Kuteka Pay intents and marketplace order create; contracts already require KYC ≥ 2. UI banners (`KisGateBanner`) + PT error mapping.
7. **Document protection:** private `identity-documents` bucket + RLS; `encryption_scheme = storage_private_bucket_v1`; access logs on snapshot/document view; field change history; export via `export_my_identity_data`.
8. **OCR / liveness:** columns and statuses prepared (`ocr_*`, `liveness_*`); pipelines deferred to a later commercial version.
9. **Visitors** may browse without KYC; contractual/payment/service actions require minimum level 2.

## Consequences

- Migration `0029_kis_identity_system.sql` must be applied before relying on gates in production.
- Demo users with seeded KYC continue to work; unverified real users are blocked from Pay until they complete KIS.
- Envelope encryption and SMS OTP remain roadmap (phone confirm is still MVP checkbox).
- Partner ICK (`ick_score`) stays separate from UTS.

## References

- `supabase/migrations/0018_identity_kyc.sql`
- `supabase/migrations/0029_kis_identity_system.sql`
- `apps/web/modules/identidade/**`
- `docs/product/KUTEKA_ROADMAP_MASTER.md` · KOS
