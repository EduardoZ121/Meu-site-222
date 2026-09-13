> **Legado Vite — não usar para produto KEOS.** Auth oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`.

# Kuteka — Regra mobile-first (para OGPT / PO)

**Data:** 2025-06-29  
**Decisão do Eduardo:** Em Angola, **a maioria usa telemóvel**. Toda alteração de UI deve ser pensada **primeiro no telemóvel**, depois no computador.

---

## O que isto significa para o OGPT

1. **Não aprovar layouts só com screenshot desktop.** Pedir sempre vista **390×844** (iPhone) ou **360×800** (Android comum) antes de dar OK.
2. **Critérios de aceitação** de qualquer ecrã devem incluir:
   - Legível sem zoom
   - Botões com área de toque ≥ 44px (menu ☰ incluído — é normal no telemóvel)
   - Secções sem “buracos” enormes entre blocos
   - Hero + pesquisa visíveis sem scroll excessivo (não precisa ocupar 100% do ecrã se prejudicar o resto)
3. **Prioridade de mercado:** mobile > tablet > desktop.
4. **Etapa 4.5 continua em curso** — design system feito; **polimento responsivo** é trabalho activo, não concluído.

---

## O que o Cursor (dev) deve fazer em cada tarefa

| Regra                    | Detalhe                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Desenhar mobile primeiro | CSS com `@media (max-width: …)` a compactar, não só a empilhar                        |
| Testar 3 larguras        | ~390px (telefone), 768px (tablet), 1280px (desktop)                                   |
| Tokens de espaço         | Usar `--space-*` — menos padding no telemóvel que no desktop                          |
| Secção “Números”         | Grelha **2×2** no telemóvel, números menores, cartões compactos                       |
| Hero homepage            | No telemóvel: **não** forçar `100dvh` — hero + pesquisa cabem sem dominar 90% do ecrã |
| Screenshots para OGPT    | Guardar em `docs/screenshots/` com sufixo `-mobile` quando for telemóvel              |

---

## Alterações recentes (mobile)

### Login / cadastro (`/entrar`, `/cadastro`)

- **Bug:** `App.css` tinha CSS Facebook (azul) que anulava `auth.css` — login não mudava.
- **Telemóvel:** formulário primeiro; logo pequeno; botão dourado Kuteka.

### Homepage `/inicio`

- Hero deixa de ocupar ecrã inteiro no telemóvel (`min-height: auto` no shell).
- Padding das secções reduzido (56px → 32px / 24px).
- **Números:** 2 colunas no telemóvel (antes: 1 coluna = cartões enormes).
- Testemunhos e cartões de pesquisa com padding menor.
- Tabs Comprar/Arrendar/Veículos repartem largura igual.

**URL de teste:** https://kutekalink.onrender.com/inicio (após deploy)

---

## Mensagem curta para colar no ChatGPT (OGPT)

```
Regra Kuteka — mobile-first (decisão Eduardo):

- Angola: utilizadores usam sobretudo TELEMÓVEL.
- Não aproves UI só com desktop. Exige screenshot ~390px antes de OK.
- Hero não deve roubar 90% do ecrã no telemóvel se prejudicar organização.
- Secção Números: 2×2 compacto no telemóvel, não cartões gigantes.
- Etapa 4.5: design system feito; polimento mobile ainda em curso.
- Cursor deve testar 390 / 768 / 1280 em cada alteração visual.

Ficheiro no repo: docs/OGPT-MOBILE-FIRST.md
```

---

## Próximo passo sugerido (OGPT)

- [ ] Revisar `/inicio` no telemóvel (Render ou screenshots)
- [ ] Aprovar ou listar ajustes por secção (hero, números, testemunhos, footer)
- [ ] Só depois avançar para **Etapa 7 — Admin**
