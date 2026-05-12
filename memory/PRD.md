# Remake Pixel — PRD

## Original Problem
Migrating "Remake Pixel" — a Telegram bot for AI image generation (Instagram @remake_pix → domain remakepix.com) — into a full web platform. Editorial cinematic design (sober purple palette), credit-based billing, JWT auth, Stripe payments, Replicate + OpenAI integrations, admin panel, i18n.

## Stack
- **Backend**: FastAPI · MongoDB (motor) · JWT auth · Stripe · Replicate · OpenAI
- **Frontend**: React 19 · Tailwind · shadcn · framer-motion · react-router-dom · sonner
- **Design**: Cormorant Garamond (serif headlines) + Manrope (body) + JetBrains Mono (labels). Palette: `#0A0A0F` bg · `#F4F1EA` text · `#7C3AED` primary · `#C4B5FD` lavender. Film grain overlay.

## Personas
1. **Creator** — uses Fast/Wizard/Suggest for ideation, Generate/Artistic for output. Starter/Creator packs.
2. **Studio user** — heavy Pro/Artistic/Posters for client work. Studio pack.
3. **Admin** — manages users, monitors revenue, adjusts credits, bans abusers.

## Implemented — Phase 1 (2026-05-12)
### Backend
- JWT auth (`/api/auth/{register,login,me}`) — 50 signup credits, referral codes, role from `ADMIN_EMAILS`
- Credits (`/api/credits/{balance,transactions}`)
- `/api/generate/image` — Fast/Advanced via Replicate `xai/grok-imagine-image`, credit-spend-then-refund pattern
- Generations (history, favorite, delete)
- Stripe checkout (Starter €5/120 · Creator €12/350 · Studio €22/600)
- Webhook `/api/webhooks/stripe` (`checkout.session.completed`, `charge.refunded`) — auto credits user + referral bonus
- Admin (`/api/admin/{stats,users,credits/adjust,users/:id,transactions}`)

### Frontend
- Landing (Hero · Quote · Features · Marquee · Pricing · Founder · FAQ · CTA · Footer)
- Auth pages (with referral support)
- Dashboard layout (sidebar · credits badge · i18n toggle)
- Generate (Fast/Advanced)
- Gallery / Favorites / Billing / Profile / Referrals / Admin
- i18n PT/EN

### Testing — 27/27 backend pytest, all frontend flows green

---

## Implemented — Phase 2 (2026-05-12)
### Backend
- **Pro** mode (`/api/generate/pro`, multipart) — photo + 20 presets (Realism/Mood/Enhance) via Flux 2 Klein, 18cr
- **Artistic** mode (`/api/generate/artistic`, multipart) — photo + 33 styles via Flux 2 Klein, 13cr
- **Video** (`/api/generate/video`, multipart) — Grok Imagine Video, ~6s, 20cr
- **Posters** (`/api/generate/poster`) — 44 templates × OpenAI `gpt-image-1`, 15cr, with placeholder 422 validation + NSFW rewrite
- **Carousel** (`/api/generate/carousel`) — 2-5 prompt slides, 8cr/slide
- **Wizard** (`/api/wizard/compose`) — 5 GPT-4o-mini questions → composed prompt
- **Suggest** (`/api/suggest`) — theme → 6 creative prompt cards
- **Settings** (`/api/settings` GET/PUT) — aspect/variations/personality/lang defaults
- **Explore** (`/api/explore`) — public gallery; `/api/me/toggle-public/:id` for publishing
- **Public catalogs**: `/api/public/{pro-presets,artistic-styles,poster-templates,wizard-steps}`
- **Rate limiting** middleware (`services/rate_limit.py`) — in-memory sliding window, 30 req/min, admin bypass
- **NSFW** handler (`services/nsfw.py`) — keyword detect + GPT-4o-mini rewrite_safe fallback; per-user `nsfw_allowed` bypass
- **Uploads** (`services/uploads.py`) — multipart → /tmp → file handle to Replicate

### Frontend
- New pages: `/app/{pro, artistic, video, posters, carousel, wizard, suggest, settings}` + public `/explore`
- Reusable `PhotoUpload` (drag/drop) and `ResultPanel` (image/video aware, favorite + publish toggle)
- Sidebar reorganized into sections: **Create · Ideas · Library · Account · Admin**
- Generate page accepts `?prompt=` query (Wizard/Suggest deep-link to it)
- Per-page `document.title` via `useTitle` hook
- Full i18n: **PT · EN · ES · FR** (header toggle cycles PT↔EN; Settings page lets you pick any)

### Testing — Phase 2: 20/20 backend pytest + all frontend routes verified
- Real Replicate Pro + Artistic + Carousel runs succeeded end-to-end
- Wizard & Suggest validated via gpt-4o-mini
- Rate limit verified (admin bypassed, user trips 429 within 35 calls)
- Settings persistence verified (`lang` propagates to `users.lang`)

---

---

## Implemented — Phase 3 / bot.py parity (2026-05-12)
### Backend (P0)
- **Registration bonus 30 credits** (bot.py parity, no longer 50)
- **6 aspect ratios** incl. `21:9` ultrawide (catálogo `aspect_ratios.py`)
- **NSFW filter disabled by default** (`NSFW_ENABLED=False` in `services/nsfw.py`) — replica do bot que deixa o provider decidir; admin pode reactivar
- **Rate limit separado**: `enforce_image()` 5/min + `enforce_message()` 30/min (admin bypass) em `services/rate_limit.py`
- **`_pre_generate_checks` helper** adicionado em `server.py` (estava em falta — várias rotas estavam quebradas)
- **POST `/api/generate/easy`** — Modo Fácil com `PADRAO_STYLES` (96 estilos reais do bot, prompts originais com `[subject]` substituível). Suporta `style_id`, `subject`, `aspect_ratio`, `extra_prompt`, `photo`.
- **POST `/api/wizard/compose`** agora aceita opções numéricas (q1/q2/q3 = 1..8) e mapeia via `_WIZ_MAP` → semantic keys (ex.: q1='4' → 'character (anime/realistic/cartoon)'). Retorna `prompt` + `answers_resolved`.
- **Endpoints públicos** já expunham `padrao-styles`, `pro-presets`, `poster-templates`, `wizard-questions`, `aspect-ratios`, `personalities`, `visual-styles`.
- **Style premium lock**: estilos com `locked=True` pedem 1 compra prévia (config no preset; check no `/generate/easy`).

### Frontend (P0)
- **`/app/generate` reescrito**: 3 tabs **Fácil / Avançado / Pôster** (substitui o antigo fast/advanced de texto livre)
  - **Fácil**: photo upload + subject (Homem/Mulher/Pessoa) + 8 categorias do bot + 96 styles do `PADRAO_STYLES`
  - **Avançado**: photo upload + 3 sub-tabs Realismo/Estilo&Humor/Enhancements com os 20 `PRO_PRESETS`
  - **Pôster**: templates com placeholders editáveis
  - 6 aspect ratios incl. 21:9
- **`/app/wizard` reescrito**: 5 passos, q1/q2/q3 como botões numéricos (1..8 / 1..8 / 1..5), q4 textarea, q5 input texto. Auto-avança ao selecionar. Voltar/Próximo/Compor.
- **`/app/pro`**: corrige `p.nome` (estava `p.label` quebrado) e adiciona aspect ratio 21:9

### Testing — Phase 3
- `/app/backend/tests/test_remake_pixel.py` — 12/12 backend tests pass (registration bonus, aspect ratios, padrao categories, pro presets shape, wizard numeric mapping, generate/easy validation, generate/pro validation, rate limit)
- Frontend smoke: 3 tabs render, 30 credits badge, 8 categorias, wizard botões numéricos (iteration_3.json)

---

## Backlog (Phase 3 in-progress → Phase 4)

### P1 — Estilos & artistic
- Importar `ESTILOS_ARTISTICOS` originais do bot (em vez dos 33 inventados em `artistic_styles.py`)
- Sistema completo de premium/sensual lock (`grant_premium_access`, `has_premium_access`, `is_style_locked` — atualmente apenas check simples por compra prévia)

### P1 — Fase C: Conversational chat & onboarding
- Chat conversacional `/app/chat` com 4 personalidades (Criativo/Técnico/Casual/Profissional) usando `AI_PERSONALITIES`
- Detecção de intenção de gerar imagem no meio do chat (`detect_image_intent`)
- Carousel conversacional (escolher N slides → estilo → descrever cada slide)
- Onboarding: "Já usaste? Sim/Não", tutorial, aceitar termos

### P1 — Fase D: Galeria pública & Instagram
- `/explore` enriquecido com "Ver Prompt" / "Prompt Premium"
- Admin Instagram autoposter queue
- `share_creation` com share_id partilhável + view stats

### P1 — Fase E: Admin god mode
- `system_config` toggles (maintenance_mode, generation_disabled, safe_mode, nsfw_enabled override)
- User flags completas (banned, shadowbanned, muted_until, tags VIP, nsfw_allowed, reports_count)
- Reports queue + System logs viewer
- Admins secundários + premium block toggle
- eBook waitlist
- Notificações instantâneas a admin (novo user, NSFW, erro)
- Style previews cache

### P2 — Fase F: Landing growth
- Free demo na landing (1 imagem/IP/24h via Replicate)
- Lead capture form / waitlist email
- Stats públicas dinâmicas



## Backlog (Phase 3)
**P1**
- Pro mode sub-tabs: separate routes for Realism / Mood / Enhance (currently one toggle)
- Forgot password flow (email reset via Resend or SendGrid)
- Object storage for permanent image archival (Replicate URLs expire)
- Stripe customer portal link
- Image lightbox in Gallery + filters (date, type, model)

**P2**
- Admin: broadcast tool, reports queue, system logs UI, gallery Instagram queue, eBook waitlist
- Webhooks → Discord/Telegram admin alerts on new purchases / NSFW attempts
- Mobile sidebar drawer (currently desktop-only)
- Public-creator profile pages (slug-based)
- Free demo on landing (1 image / IP / 24h via Replicate)

## Operational Notes
- `/app/backend/.env` currently uses the **DEV keys from the problem statement** → **MUST rotate** before production.
- Stripe is in **live mode**. Update merchant display name in Stripe Dashboard → Business → Public Details to "Remake Pixel" (currently shows "NanonIA").
- Admin role is granted at registration if email is in `ADMIN_EMAILS`. To promote later, set role directly in MongoDB.
- Test credentials: `/app/memory/test_credentials.md`.
- Rate limit and NSFW filter are configurable via `services/rate_limit.py` and `services/nsfw.py` constants (or migrate to `system_config` Mongo collection in Phase 3).
