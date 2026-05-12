# Remake Pixel — PRD

## Original Problem
Migrating "Remake Pixel" — a Telegram bot for AI image generation (Instagram @remake_pix → domain remakepix.com) — into a full web platform. Editorial cinematic design (sober purple palette, NOT neon), credit-based billing, JWT auth, Stripe payments, Replicate + OpenAI integrations, admin panel, i18n (PT/EN initially).

## Stack
- **Backend**: FastAPI · MongoDB (motor) · JWT auth · Stripe · Replicate · OpenAI
- **Frontend**: React 19 · Tailwind · shadcn · framer-motion · react-router-dom · sonner
- **Design**: Cormorant Garamond (serif headlines) + Manrope (body) + JetBrains Mono (labels). Palette: `#0A0A0F` bg · `#F4F1EA` text · `#7C3AED` primary · `#C4B5FD` lavender. Film grain overlay.

## Personas
1. **Creator** — uses Fast mode for quick edits, Advanced for ideation. Buys Starter/Creator packs.
2. **Studio user** — heavy Pro/Artistic editing for client work. Studio pack.
3. **Admin** — manages users, monitors revenue, adjusts credits, bans abusers.

## Implemented (Phase 1 — 2026-05-12)
### Backend
- `/api/auth/{register,login,me}` JWT, bcrypt, 50 signup credits, referral bonus on first €5+ purchase
- `/api/credits/{balance,transactions}`
- `/api/generate/image` (Fast/Advanced) — real Replicate `xai/grok-imagine-image`; spends 10–11 credits; refunds on failure
- `/api/generations/{history,:id/favorite,:id}` — list/toggle/delete
- `/api/stripe/checkout` (Starter €5/120 · Creator €12/350 · Studio €22/600)
- `/api/webhooks/stripe` — `checkout.session.completed` credits user + pays referral; `charge.refunded` removes credits
- `/api/admin/{stats,users,credits/adjust,users/:id (PATCH),transactions}` — admin-gated
- `/api/public/{stats,styles,packages}` — public endpoints

### Frontend
- Landing (Hero · Quote · Features · Marquee · Pricing · Founder · FAQ · CTA · Footer)
- Auth pages (Login/Register with referral support)
- Dashboard layout (sidebar + live credits badge + i18n toggle)
- Generate page (Fast/Advanced tabs · 33 styles grid · aspect ratios · variations · result preview · prompt improver)
- Gallery + Favorites
- Billing (3 packages · Stripe checkout · transaction history)
- Profile · Referrals (code + share link)
- Admin (stats · users table · credit adjust · ban · transactions)

### Testing
- **27/27 backend pytest cases passed** (auth, credits, real Replicate generation, Stripe checkout, admin gating)
- Frontend E2E green on every flow tested

## Backlog (Phase 2 — P0/P1/P2)
**P0 (next sprint)**
- Pro mode (photo upload → Flux 2 Klein, 7 realism presets + 6 expression presets + 6 enhancements)
- Artistic mode (33 artistic styles via Flux 2 Klein)
- Video generation (xai/grok-imagine-video, 20cr)
- Poster generation (44 templates × gpt-image-1, 15cr)
- Carousel (2-5 photos OR text → connected slides)
- ES + FR i18n complete (PT/EN already wired)

**P1**
- Wizard (5-question GPT-4o-mini conversational onboarding)
- Suggest (theme-based prompt suggestions)
- Settings page (default aspect/style/variations/personality)
- Explore page (public gallery with "View Prompt"/"Premium Prompt")
- NSFW handling (per-user `nsfw_allowed` flag → flux-kontext-max fallback)
- Rate limiting middleware (configurable in admin)
- Forgot password flow (email reset)

**P2**
- Object storage for permanent image archival (Replicate URLs expire)
- Admin: broadcast tool, reports queue, system logs UI, gallery Instagram queue, eBook waitlist
- Stripe customer portal link
- Webhooks for Discord/Telegram admin alerts
- Mobile sidebar drawer

## Operational Notes
- All API keys currently in `/app/backend/.env` are **DEV** keys shared in the problem statement → **MUST rotate** before production deployment.
- Stripe is in **live mode**. Test purchases will charge real money. Use `stripe listen --forward-to <url>/api/webhooks/stripe` for local webhook testing.
- Admin role is granted at registration time when email is in `ADMIN_EMAILS`. To promote an existing user, update directly in Mongo or use future "promote" admin tool.
- Test credentials live at `/app/memory/test_credentials.md`.

