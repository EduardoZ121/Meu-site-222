# Changelog — 2026-05-13 (Mobile bug fixes + UX overhaul)

## Critical fixes
- **Replicate 422 on `4:5` / `21:9`**: Grok-Imagine only accepts a specific ratio whitelist. Added `normalize_aspect_ratio()` in `services/replicate_service.py` that maps any UI ratio → nearest supported by the upstream model. This was the root cause of "Network Error" / silent generation failures on mobile.
- **Logo inconsistency**: Created single `<Logo />` component in `/components/Logo.jsx` used in landing Navbar, dashboard sidebar, dashboard header (mobile), Footer, and Logo lockup. No more 3 different logo styles.
- **Mobile image upload fails on 4G**: Added client-side compression `lib/imageCompress.js` (resize to ≤1280px, JPEG q85) before all FormData uploads (Generate/Pro/Video/Artistic). Reduces 5–10 MB phone photos to ~200 KB.
- **PhotoUpload preview broken on Android Chrome**: Reworked `URL.createObjectURL` into `useEffect` with cleanup via `URL.revokeObjectURL`.
- **Axios timeout**: Set to 180s globally + 240s for video.

## New: Unified studio (matches bot.py flow)
- `/app/generate` rewritten as a single intelligent studio:
  - Photo upload **optional**
  - Prompt textarea (3–800 chars)
  - Style picker **optional** (collapsible)
  - Aspect ratio (6 options)
  - Smart CTA decides the route:
    - prompt only → `POST /generate/image` (10 cr)
    - photo + prompt → `POST /generate/edit` (12 cr, NEW)
    - photo + style → `POST /generate/easy` (11 cr)
    - photo + style + prompt extra → `POST /generate/easy` with `extra_prompt` (11 cr)
- New endpoint `POST /api/generate/edit` for photo edit with free-text prompt (no preset).

## Dashboard visual identity (matches landing now)
- Background `#0B0B0C`, Inter Tight font, `#7C3AED` accents, mono labels in JetBrains
- Sidebar simplified: Criar (Estúdio · Pôsteres · Vídeo · Carrossel) · Biblioteca · Conta · Admin
- Removed sidebar entries for Pro / Artístico / Wizard / Sugestões — kept as routes (still accessible), but Wizard + Sugestões are now reached via buttons inside the unified studio (matches the bot UX).
- Header: hamburger (mobile) + Logo + Credits badge + Avatar

## Detailed error toasts (8s duration)
- 402 → "Créditos insuficientes."
- 401 → "Sessão expirada."
- 429 → "Demasiados pedidos. Espera 1 minuto."
- Timeout → "Tempo esgotado — tenta de novo."
- Other → shows backend `detail` verbatim

## Verified via curl
- `/generate/image` (prompt only, 4:5) → HTTP 200, 10 cr
- `/generate/edit` (photo + free prompt, 4:5) → HTTP 200, 12 cr
- `/generate/easy` (photo + style) → HTTP 200, 11 cr (already worked)
- Backend normalization: `4:5` → `3:4` for Grok, kept for Flux; `21:9` → `2:1` for Grok, kept for Flux


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



# Changelog — 2026-02-14 (P0: Bot.py source-of-truth migration)

## Critical: replaced hallucinated prompt dictionaries with real bot data
Previous fork agents had fabricated prompts in 4 backend files. User uploaded
`/tmp/bot.py` (9838 lines) as the authoritative source. AST-parsed and verified
byte-by-byte against the bot.

### Files regenerated
- `backend/padrao_styles.py` → 93 styles (was 96 with 3 phantom keys: `shadows`, `polaroid`, `journey`). 100% byte-exact with bot `PADRAO_STYLES`.
- `backend/artistic_styles.py` → 33 styles (was 62 fabricated entries). 100% prompt-exact with bot `ESTILOS_ARTISTICOS`.
- `backend/pro_presets.py` → 20 presets (no change needed; already faithful — merge of `PRO_PRESETS`+`PRO_REALISM_EXTRA`+`PRO_STYLE_MOOD`+`PRO_ENHANCEMENTS`).
- `backend/poster_templates.py` → 20 templates (was 50 fully invented `music_*` / `sports_*` etc.). Now derived from bot: 6 flyers + 2 editorial + 5 epic + 2 sci-fi + 1 hero + 4 phone. `POSTER_DIRECTOR` and `MOOD_EXPANSIONS` infrastructure preserved.

### Tooling
- New `backend/scripts/extract_bot_dicts.py` — AST-based, runnable any time the bot evolves: `python3 scripts/extract_bot_dicts.py /tmp/bot.py`.
- Snapshot at `backend/scripts/.bot_dicts.pkl` for regression tests.

### Verification (zero Replicate calls — no credits spent)
```
PADRAO_STYLES:     93/93 byte-exact, 0 extras
PRO_PRESETS:       20/20 prompt-exact
ARTISTIC_STYLES:   33/33 prompt-exact
POSTER_TEMPLATES:  20/20 prompt-exact (with [subject]→the person)
```
All 4 public endpoints (`/api/public/padrao-styles`, `/artistic-styles`, `/pro-presets`, `/poster-templates`) return the correct counts after backend restart.

### Backend API impact
- `POSTER_TEMPLATES` items now have `placeholders: []` (bot prompts are fixed, no user variables). Server `.format(**{})` is a no-op on these.
- Frontend Posters UI may still render placeholder input fields — they'll just be empty/hidden. Cosmetic refactor pending.

## Pending after P0
- Frontend Posters page: hide placeholder fields when template `placeholders.length === 0`; show category tabs (Flyer / Editorial / Epic / Sci-Fi / Hero / Phone) instead of fake `music_*`.
- Frontend Artistic page: 33-style grid (was 62), respect new categories from `/api/public/artistic-styles`.
- Phase C — Conversational Chat IA with 4 personalities + onboarding (data already extracted: `AI_PERSONALITIES` 4 keys).
- Phase D — Public gallery, "Ver Prompt", Admin Instagram queue.
- Phase E — Admin god mode.
- Refactor: split `backend/server.py` (~1480 lines) into routers.
