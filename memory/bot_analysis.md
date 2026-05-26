# Análise do `bot.py` (9838 linhas) — Levantamento completo

Documento para o utilizador decidir o que migrar para o site, na ordem de prioridade que ele decidir.
Cada secção indica: **(✅ feito)** / **(⚠️ parcial / incorreto)** / **(❌ em falta)**

---

## 1. CRÉDITOS — base económica
- ⚠️ **Bónus de registo: 30 créditos** (não 50 como eu fiz). Corrigir.
- ✅ Pacotes: €5/120cr · €12/350cr · €22/600cr
- ✅ Referral bonus 10cr quando indicado compra >€5
- ❌ **Sistema premium/sensual lock**: estilos bloqueados que desbloqueiam após **primeira compra**. Há um conjunto `_LOCKED_PREMIUM_KEYS` e um conjunto `FREE_SENSUAL_KEYS` que ficam grátis. Funções `grant_premium_access`, `has_premium_access`, `is_style_locked`, `is_locked_for_user`.

## 2. ESTILOS — o coração do produto
### 2a. Modelo Padrão (Grok) — `PADRAO_STYLES` (≈65 estilos)
- ❌ **Tens 65+ estilos com prompts COMPLETOS escritos à mão**, organizados em categorias e sub-grupos:
  - **Homens (5)**: Submerso Cinematográfico, Luxury Glamour Dourado, Low-Key Profissional, Don Vermelho, Herói Sombrio Editorial
  - **Mulheres (4)**: Baton Rouge Editorial, Café Editorial Bege, Selfie Espelho Confiante, Selfie Suave & Glow
  - **Unissex — Clássicos (4)**: Joker Dualidade, Rembrandt Clássico, Pôster Tinta Editorial, Corporativo P&B
  - **Unissex — Trilogia Leão (3)**: Inverno, Deserto, Sombra
  - **Unissex — Music Phone (4)**: Spotify Gigante, Neon Music World, Apple Minimal Luxo, Street Music Energy
  - **Unissex — Editorial Pôster (2)**: Future Vision, Modern Edge
  - **Unissex — B&W Studio (3)**: Chiaroscuro, Sombras Duras, Rembrandt Suave
  - **Unissex — Hacker Noir (3)**: Hacker Noir, Vigilância, Hacker na Chuva
  - **Unissex — Carmesim (3)**: Domínio, Sombra, Brilho Suave
  - **+ Stories** (`PADRAO_STORIES` — 9:16 verticais)
  - **+ Outros sub-grupos** (Sensual `sn_*`, etc.)
  - Eu inventei 33. O bot tem 65+ com prompts próprios.

### 2b. Modelo Pro — `MODELO_PRO` + 3 sub-menus
- ❌ **Sub-menu "📷 Deixa mais realista"**:
  - Original, Expressão Fiel, Realismo Suave, Cinematográfico, Ultra Realista, iPhone/Selfie Natural, **Studio Portrait**
- ❌ **Sub-menu "🎭 Estilo & Humor"** (`PRO_STYLE_MOOD`):
  - Sorriso Natural, Olhar Sedutor, Pose de Modelo, Expressão Intensa, Vibe Romântica, Expressão Divertida, Pose Full Body
- ❌ **Sub-menu "✨ Enhancements"** (`PRO_ENHANCEMENTS`):
  - Iluminação, Cabelo/Pele/Textura, Roupa, Cores Vibrantes, Olhos Vivos, Geral + Detalhes Máximos
- **Cada um tem prompt em inglês profissional escrito à mão** (~500-800 chars cada).
- Eu coloquei genéricos com 1 frase cada.

### 2c. Modelo Artístico — `ESTILOS_ARTISTICOS`
- ⚠️ Existe um catálogo próprio do bot que **não copiei**. Inventei 33.

### 2d. v2 — ESTILOS UNIFICADOS V2 (43)
- ❌ O bot tem **um novo sistema v2** com 43 estilos unificados + 4 tamanhos só, com toggle de seleção múltipla por user (`get_user_styles_v2`, `toggle_user_style_v2`). É a versão "moderna" do bot. Não migrei nada disto.

## 3. WIZARD — Assistente de criação
- ⚠️ **Tem 5 perguntas com OPÇÕES (1-8) específicas**, não texto livre como fiz:
  - **Q1: O que queres criar?** → Flyer/Pôster, Logo, Arte Conceitual, Personagem, Paisagem, Produto, Retrato, Outro
  - **Q2: Que estilo visual?** → Anime, Realista, Pintura digital, 3D Pixar, Sketch, Minimalista, Cyberpunk, Vintage
  - **Q3: Formato?** → 3:4, 1:1, 16:9, 9:16, 4:5
  - **Q4: Descrição livre detalhada**
  - **Q5: Foto de referência opcional**
- Tens textos completos em PT/EN/ES (FR em falta no bot).
- A escolha numérica mapeia para chaves (`flyer`, `logo`, etc.). Eu fiz texto livre.

## 4. PERSONALIDADES IA — `AI_PERSONALITIES`
- ❌ 4 personalidades com **system prompt completo** para o chat:
  - 🎨 **Criativo**: "Inspirador e artístico"
  - 🤖 **Técnico**: "Preciso e detalhado"
  - 😊 **Casual**: "Amigável e descontraído"
  - 💼 **Profissional**: "Formal e eficiente"
- Eu só mostro botões na página Settings, não há chat conversacional no site.

## 5. CHAT SUPERINTELIGENTE — `get_smart_chat_response`
- ❌ **TODO um sistema de chat com IA não migrado**:
  - Detecta intenção de gerar imagem no meio de uma conversa (`detect_image_intent`, `classify_user_intent_ai`)
  - Mantém contexto da conversa (`chat_contexts`)
  - Aplica personalidade escolhida pelo user
  - É a "alma" do bot — falta no site.

## 6. CARROSSEL
- ⚠️ Bot tem fluxo conversacional: pedir nº de slides → estilo (`carousel_style_*`) → descrever cada slide um a um, com **prompt automaticamente reformulado** ("Slide 1 of N Instagram carousel: ... Consistent visual style"). Eu fiz textarea simples.
- Tem catálogo `styles_carousel` próprio. Não copiei.

## 7. VÍDEO
- ❌ Não vi código profundo ainda — provavelmente em `xai/grok-imagine-video`. Tenho que verificar comandos `/video` e fluxo. Site tem só endpoint, mas página é genérica.

## 8. ADMIN — Painel completo (god mode)
- ⚠️ Implementei só básico (stats, ajustar créditos, ban). Falta:
  - **`DEFAULT_SYSTEM_CONFIG`**: toggles globais (nsfw_enabled, maintenance_mode, generation_disabled, safe_mode, rate_limit_per_min, nsfw_keywords)
  - **Flags por user**: banned, shadowbanned, muted_until, tags (VIP, etc.), nsfw_allowed, reports_count
  - **Reports**: fila de reports com `add_report`, `update_report_status`, `get_pending_reports` (pending/banned/ignored/safe)
  - **Logs de sistema**: rolling 500 logs (`log_system_event` com level=info/warn/error/payment/nsfw/ban)
  - **Admins secundários**: adicionar/remover, com bloqueio premium toggle (`admin_toggle_secondary_premium_block`)
  - **Notificações instantâneas**: novo user, erro, NSFW, etc. (no bot, manda mensagem ao admin)
  - **Galeria Instagram autoposter**: fila de criações para publicar no IG (admin gere)
  - **eBook waitlist**: `add_to_ebook_waitlist`, `get_ebook_waitlist_count`, `get_ebook_waitlist_users`
  - **Style previews**: gerir previews dos estilos no canal (`save_style_preview`, `get_style_preview`)
  - **Gallery prompts**: cache de prompts da galeria (ver prompt no canal)
  - **Backup automático**: snapshot dos JSONs

## 9. CANAL/GALERIA PÚBLICA
- ❌ `GALLERY_CHANNEL` — canal do Telegram para publicar criações públicas automaticamente
- ❌ "Ver Prompt" / "Prompt Premium" nas criações da galeria (já está no problem statement)
- ❌ `share_creation` → ID partilhável `share_*`
- ❌ Estatísticas de views por share

## 10. ESTATÍSTICAS DE UTILIZADOR
- ⚠️ Bot regista: `total_creations`, `total_edits`, `total_favorites`, `total_shares`, `total_time_saved`, `first_use`, `last_use`
- Eu só mostro saldo e data de criação no Profile.

## 11. ONBOARDING
- ❌ **Já usaste este bot antes? Sim/Não** → fluxo diferente
- ❌ **Tutorial** para quem é novo
- ❌ **Termos de uso** aceitar/recusar (`terms_accept` / `terms_decline`)
- Não tenho nada disto no site.

## 12. ASPECT RATIOS
- ⚠️ Bot tem **6**: 3:4 (portrait), 1:1 (square), 16:9 (landscape), 9:16 (story), 4:5 (insta), 21:9 (wide)
- v2 só tem 4. Site tem 5.

## 13. PROMPT IMPROVER
- ✅ `improve_prompt_auto` via gpt-4o-mini — feito, mas no bot é **sempre em inglês independente do input**.

## 14. RATE LIMITING
- ⚠️ Bot tem `RATE_LIMIT_IMAGES=5/min` e `RATE_LIMIT_MESSAGES=30/min` (separado). Admin bypass. **Safe mode** divide o limite por 2. Eu fiz só messages, não separei imagens.

## 15. NSFW
- ⚠️ **Desativado no código atual** — o bot deixa o Replicate decidir. Eu activei filtro keyword + rewrite. Devia desativar por defeito.

## 16. COMANDOS DO BOT (slash commands)
- `/start`, `/menu`, `/wizard`, `/modo` (ou `/mode`), `/help`, `/ajuda`, `/historico`, `/favoritos`, `/loja`, `/creditos`, `/idioma`, `/personalidade`, `/sair`
- ❌ Site não tem equivalente a comandos rápidos — não obrigatório, mas dá-me ideia de quantos atalhos o user esperava.

## 17. LANDING — endpoints já existem no bot!
- ⚠️ O bot **já tem** `/api/public/stats`, `/api/leads/subscribe`, `/api/demo/generate` (free demo 1×/IP/24h).
- ✅ Eu reimplementei stats. Falta:
  - ❌ **Free demo na landing** (1 imagem grátis por IP por 24h) — exactamente o que sugeri como enhancement, mas o bot já tem.
  - ❌ **Lead capture** (email/nome) — formulário "junta-te à waitlist" para marketing.

## 18. INSTAGRAM AUTO-POSTER
- ❌ Admin escolhe criações que vão para fila de publicação Instagram. Há script externo `instagram_poster.py` que consome a fila. Falta no site.

---

# DIAGNÓSTICO RESUMIDO

**O que está minimamente OK:**
- Auth, créditos básicos, Stripe checkout, webhook, landing visual.

**O que está mal/genérico:**
- Estilos (inventei vs. tens 65+ escritos à mão)
- Wizard (texto livre vs. 5 perguntas com 8/8/5 opções)
- Pro mode (1 tab vs. 3 sub-menus com prompts profissionais)
- Bónus inicial (50 vs. 30)

**O que está em falta por completo:**
- Chat conversacional com IA + 4 personalidades
- Sistema premium/sensual lock
- Galeria pública/canal Instagram com fila admin
- Reports queue
- Logs do sistema
- Admins secundários
- Notificações automáticas
- eBook waitlist
- Style previews
- Free demo na landing
- Lead capture na landing
- Onboarding (já usaste?/tutorial/termos)
- Estatísticas do user completas

---

# PROPOSTA DE ORDEM DE EXECUÇÃO

**Fase A — Correções básicas** (pequenas mas essenciais):
1. Bónus inicial 30 (não 50)
2. Aspect ratios: 6 opções (adicionar 21:9 wide)
3. NSFW filter: desativar por defeito (deixar Replicate decidir)
4. Rate limit: separar imagens (5/min) de mensagens (30/min)

**Fase B — Estilos REAIS do bot**:
5. Importar **PADRAO_STYLES** completo (65+) com prompts originais e categorias/grupos
6. Importar **PRO_PRESETS + PRO_REALISM_EXTRA + PRO_STYLE_MOOD + PRO_ENHANCEMENTS** (3 sub-tabs com prompts originais)
7. Importar **ESTILOS_ARTISTICOS** original
8. Sistema premium/sensual lock

**Fase C — Fluxos que faltam**:
9. Wizard com 5 perguntas + opções 1-8 (não texto livre)
10. Chat conversacional com 4 personalidades (página `/app/chat`)
11. Carousel conversacional (estilo + N slides + descrição por slide)
12. Onboarding (já usaste? + tutorial + termos)

**Fase D — Galeria pública + canal**:
13. Galeria pública `/explore` ligada ao share_id
14. Admin: fila Instagram autoposter
15. "Ver Prompt" / "Prompt Premium"

**Fase E — Admin god mode**:
16. System config toggles (maintenance, generation_disabled, safe_mode)
17. User flags (shadowban, mute, tags VIP, nsfw_allowed)
18. Reports queue
19. System logs viewer
20. Admins secundários
21. eBook waitlist

**Fase F — Landing**:
22. Free demo (1 imagem/IP/24h)
23. Lead capture

---

# A TUA DECISÃO

Dá-me uma destas respostas:
1. **"Faz Fase A + B"** (ou outra combinação) — eu faço só isso e paro
2. **"Faz tudo na ordem"** — eu vou fazendo e mostrando a cada Fase
3. **"Primeiro corrige X, Y, Z"** — diz especificamente

Não toco em código até tu confirmares.
