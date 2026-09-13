# Directriz permanente — Experiência Premium Kuteka

**Estado:** Activa · Core v1.0 + expansão · 2026-08-01

1. **Continuidade Landing ↔ Plataforma** — mesma atmosfera cinematográfica escura, tipografia e marca.
2. **Atmosfera full-bleed** — vídeo/imagem lento, veil escuro uniforme, blur; nunca banner-cartão.
3. **Glass** — painéis legíveis (`.kuteka-glass` / `.kuteka-glass-chrome` escuro na chrome).
4. **Feed vivo no Início** — atalhos + scroll contínuo (destaques, próximos, populares, patrocinados).
5. **Demo densa** — dezenas de anúncios com galeria, preço, localização e descrição.
6. **Fluxo contínuo** — `FlowNextSteps` / `ForbiddenPanel`; sem becos «Voltar».
7. **Render estável** — sem títulos a desaparecer; skeletons só em zonas de lista; base plate na atmosfera.
8. **N5 integral** — concluir módulo antes do seguinte; revisão crítica pré-merge.

Implementação: `AtmosphereBackground`, `ModuleIntro`, `PlatformFeed`, `FlowNextSteps`, `globals.css`.  
Baseline: `docs/product/KUTEKA_PLATFORM_CORE_V1.md`.
