# PASSO 1 — Especificação da Landing Page

**Documento:** Especificação oficial de produto / UX / UI  
**Versão:** 1.0  
**Estado:** Aprovado oficialmente · **Implementação encerrada**  
**Código:** Entregue em `apps/web` · Validação: `LANDING_FUNCTIONAL_VISUAL_VALIDATION.md`  
**Dependências aprovadas:**

- Manual Operacional da Kuteka
- Software Architecture Blueprint
- Design System & UX Blueprint (Nº 003)
- PASSO 0 — Identidade Oficial da Kuteka
- `docs/AI_CONTEXT.md`

**Sequência obrigatória:** Especificação → Revisão → Aprovação → (só depois) Desenvolvimento

---

## 1. Objectivo do módulo

### 1.1 Objectivo principal

Criar a **porta de entrada pública** da Kuteka: uma Landing Page que, em menos de **3 segundos**, comunique que a Kuteka é uma PropTech africana de **património e confiança** — não um site de anúncios — e oriente o visitante para uma única acção clara.

### 1.2 Objectivos secundários

- Transmitir confiança, inovação e profissionalismo.
- Diferenciar a Kuteka das plataformas tradicionais, de forma simples.
- Despertar curiosidade para explorar — sem sobrecarregar.
- Preparar a transição para Autenticação (`Começar`) ou exploração pública (`Explorar`).
- Estabelecer o padrão visual premium (2030) alinhado ao Design System.

### 1.3 Fora de âmbito (PASSO 1)

- Login / registo (FASE 2 / PRD-001)
- Dashboards, Sidebar da App, KAI funcional
- Listagens completas autenticadas
- Pagamentos, contratos, wallet
- Conteúdo SEO longo / blog
- Implementação em código

---

## 2. Público-alvo

### 2.1 Primário

| Persona                        | Necessidade na Landing                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| **Cliente** (compra / arrenda) | Perceber que pode confiar e encontrar habitação com transparência |
| **Parceiro Patrimonial**       | Perceber que pode activar e gerir património com profissionalismo |

### 2.2 Secundário

| Persona                                  | Necessidade                          |
| ---------------------------------------- | ------------------------------------ |
| **Agente Certificado** (futuro)          | Reconhecer seriedade institucional   |
| **Visitante institucional / investidor** | Ler confiança e visão de longo prazo |

### 2.3 Estado do visitante

- Primeira visita ou retorno sem sessão
- Pode estar em telemóvel (prioridade)
- Não deve precisar de “aprender” a página

---

## 3. Jornada do utilizador

### 3.1 Fluxo feliz (Happy path)

```
Chegada à Landing
    ↓
Compreende propósito (≤ 3 s)
    ↓
Escolhe acção
    ├─ Começar → Autenticação (passo futuro)
    └─ Explorar → Vista pública de patrimónios (passo futuro / teaser)
```

### 3.2 Jornada detalhada

1. **Descoberta** — Utilizador abre `kutekalink.com` (ou domínio oficial).
2. **Reconhecimento** — Vê marca Kuteka + frase de posicionamento.
3. **Compreensão** — Lê uma linha de apoio; percebe “património + confiança”.
4. **Confiança** — Secção “Porque somos diferentes” (3 razões máximas).
5. **Decisão** — Clica CTA principal ou secundário.
6. **Opcional** — Scroll suave para “Como funciona” (3 passos).
7. **Saída controlada** — Footer mínimo com links institucionais.

### 3.3 Caminhos alternativos

- Utilizador já autenticado (futuro): redireccionar para dashboard do papel activo — **não faz parte da implementação deste passo**, apenas regra de produto a reservar.
- Utilizador hesitante: permanece na Landing; não há pop-ups agressivos nem chat invasivo.

### 3.4 Estados emocionais alvo (PASSO 0)

- 0–3 s: clareza + confiança + convite
- Após secção diferença: respeito / curiosidade
- Ao clicar CTA: progresso sem ansiedade

---

## 4. Arquitectura da informação

### 4.1 Hierarquia da página (ordem fixa)

```
A. Barra superior mínima (marca + entrar)
B. Hero (missão única)
C. Porque a Kuteka é diferente
D. Como funciona (3 passos)
E. Fecho / CTA de reforço
F. Rodapé mínimo
```

### 4.2 Princípio

- **Above the fold (mobile e desktop):** apenas A + B.
- Secções C–E só após scroll.
- Máximo de **uma missão** no primeiro ecrã: compreender e agir.

### 4.3 O que não entra na Landing v1

- Stats inventados (“120+ anúncios”)
- Grelhas de categorias
- Cards de features excessivos
- Depoimentos fabricados
- App stores / QR
- Formulários longos
- Vídeo autoplay com som

---

## 5. Estrutura completa de cada secção

### Secção A — Topbar pública (mínima)

| Elemento      | Descrição                                                                   |
| ------------- | --------------------------------------------------------------------------- |
| Esquerda      | Logótipo Kuteka (palavra + símbolo)                                         |
| Direita       | Link texto **Entrar** + botão compacto **Começar** (mobile: só **Começar**) |
| Comportamento | Fixa no scroll com fundo discreto (glass muito leve)                        |
| Missão        | Orientação sem competir com o hero                                          |

### Secção B — Hero (primeiro viewport)

| Elemento       | Descrição                                                                           |
| -------------- | ----------------------------------------------------------------------------------- |
| Eyebrow        | `Kuteka · PropTech africana` (opcional, discreto)                                   |
| Título         | Posicionamento oficial                                                              |
| Subtítulo      | Uma frase de apoio                                                                  |
| CTA primário   | **Começar**                                                                         |
| CTA secundário | **Explorar**                                                                        |
| Visual         | Plano full-bleed (imagem/atmosfera de património + gradiente Slate/Orange discreto) |
| Proibido       | Stats, badges flutuantes, cards sobre a imagem                                      |

### Secção C — Porque somos diferentes

| Elemento         | Descrição                                             |
| ---------------- | ----------------------------------------------------- |
| Título de secção | Curto                                                 |
| 3 blocos         | Ícone + título + 1 frase cada                         |
| Conteúdo         | Confiança · Património · Transparência (ver secção 7) |
| Layout           | 1 coluna mobile · 3 colunas desktop                   |
| Missão           | Diferenciação sem sobrecarga                          |

### Secção D — Como funciona

| Elemento           | Descrição                              |
| ------------------ | -------------------------------------- |
| Título             | `Como funciona`                        |
| 3 passos numerados | Descobrir → Confiar → Activar          |
| CTA opcional       | Repetir **Começar** no final da secção |

### Secção E — Fecho

| Elemento | Descrição                 |
| -------- | ------------------------- |
| Frase    | Reforço da promessa       |
| CTA      | **Começar** (único botão) |

### Secção F — Footer

| Elemento | Descrição                                                            |
| -------- | -------------------------------------------------------------------- |
| Marca    | Kuteka                                                               |
| Links    | Termos · Privacidade · Contacto (placeholders até existirem páginas) |
| Nota     | © ano · Angola                                                       |
| Tom      | Institucional, mínimo                                                |

---

## 6. Conteúdo de cada bloco (textos sugeridos)

> Textos em português de Angola / PT-PT alinhado aos documentos.  
> Podem ser afinados na revisão, mas a **estrutura e tom** são oficiais.

### 6.1 Topbar

- Marca: `Kuteka`
- Link: `Entrar`
- Botão: `Começar`

### 6.2 Hero

- Eyebrow: `Kuteka · Angola`
- Título: `Património. Confiança. Habitação.`
- Subtítulo: `A plataforma que protege, valoriza e acompanha o seu património imobiliário — com transparência e profissionalismo.`
- CTA primário: `Começar`
- CTA secundário: `Explorar`

### 6.3 Porque somos diferentes

- Título da secção: `Porque a Kuteka é diferente`
- Intro (opcional, 1 linha): `Não somos um site de anúncios. Somos uma plataforma de património e confiança.`

**Bloco 1 — Confiança**

- Título: `Confiança verificável`
- Texto: `Identidades, documentos e processos claros — para decidir com segurança.`

**Bloco 2 — Património**

- Título: `Património, não só imóveis`
- Texto: `Cada activo pode ser activado, acompanhado e valorizado ao longo do tempo.`

**Bloco 3 — Transparência**

- Título: `Transparência total`
- Texto: `Histórico, estados e responsabilidades visíveis para todas as partes.`

### 6.4 Como funciona

- Título: `Como funciona`
- Passo 1: `Descobrir` — `Encontre oportunidades com informação clara.`
- Passo 2: `Confiar` — `Verifique score, documentos e histórico do património.`
- Passo 3: `Activar` — `Clientes avançam; Parceiros Patrimoniais activam o seu património.`
- CTA: `Começar`

### 6.5 Fecho

- Frase: `Construída para durar — com confiança, tecnologia e excelência operacional.`
- CTA: `Começar`

### 6.6 Footer

- `Termos de utilização`
- `Política de privacidade`
- `Contacto`
- `© 2026 Kuteka`

---

## 7. CTAs

| ID    | Label           | Tipo                       | Destino (futuro)    | Prioridade |
| ----- | --------------- | -------------------------- | ------------------- | ---------- |
| CTA-1 | Começar         | Primário (Orange)          | `/auth` ou registo  | Máxima     |
| CTA-2 | Explorar        | Secundário (outline/ghost) | `/explorar` público | Alta       |
| CTA-3 | Entrar          | Texto / terciário          | `/auth?mode=entrar` | Média      |
| CTA-4 | Começar (fecho) | Primário                   | igual a CTA-1       | Reforço    |

### Regras de CTA

- No primeiro viewport: **no máximo 2** botões (Começar + Explorar).
- Cor primaria apenas no CTA principal.
- Sem CTAs concorrentes (“Publicar”, “Ver preços”, “Download app”) na v1.

---

## 8. Elementos de confiança

Na Landing v1, a confiança é **sóbria** (sem números falsos):

1. **Linguagem institucional** — PropTech / património / transparência.
2. **Três pilares** — Confiança verificável · Património · Transparência.
3. **Passos claros** — Descobrir → Confiar → Activar.
4. **Visual premium** — Orange + Slate, tipografia Inter, espaço generoso.
5. **Sem pressão** — sem contadores regressivos, sem “oferta do dia”.
6. **Footer institucional** — Termos e Privacidade visíveis.

**Reservado para versões futuras (não v1):**  
Passaporte Digital em destaque, KTK Score ao vivo, selos SCK, depoimentos verificados, métricas reais de mercado.

---

## 9. Comportamento responsivo

### 9.1 Mobile (prioridade — ≤ 767 px)

- Hero: título legível, subtítulo 2–3 linhas, CTAs empilhados (Começar full-width, Explorar abaixo).
- Topbar: logo + Começar (Entrar no menu ou sob o logo).
- Secção diferença: 3 blocos empilhados com espaço 24–32.
- Como funciona: timeline vertical.
- Touch targets ≥ 44 px.
- Sem hover obrigatório para compreender.

### 9.2 Tablet (768–1023 px)

- Hero com tipografia intermédia.
- Diferença: 3 colunas se couber; senão 1.
- CTAs lado a lado se houver espaço.

### 9.3 Desktop (≥ 1024 px)

- Hero: texto à esquerda ou centrado (composição única, não dashboard).
- Imagem/atmosfera full-bleed atrás.
- Diferença: 3 colunas alinhadas.
- Como funciona: 3 colunas ou steps horizontais.
- Largura máxima do texto ~640–720 px para leitura.

### 9.4 Regras transversais

- Mesma hierarquia em todos os breakpoints.
- Nenhum conteúdo essencial só em hover.
- Imagens otimizadas (futuro: next/image).

---

## 10. Animações e microinterações

| Momento             | Comportamento                                   | Duração       |
| ------------------- | ----------------------------------------------- | ------------- |
| Entrada do hero     | Fade-in do título e CTAs (stagger leve)         | ≤ 250 ms cada |
| Scroll para secções | Reveal suave (opacity/translateY curto)         | ≤ 250 ms      |
| Hover CTA (desktop) | Elevação/opacidade discreta                     | ≤ 150 ms      |
| Focus teclado       | Anel de foco visível (acessibilidade)           | imediato      |
| Clique CTA          | Feedback pressed / loading se navegação demorar | —             |
| Reduced motion      | Desactivar motion não essencial                 | —             |

**Proibido:** parallax agressivo, partículas, loaders de marca demorados, autoplay de vídeo com som.

---

## 11. Estados da página

| Estado                         | Comportamento                                                      |
| ------------------------------ | ------------------------------------------------------------------ |
| Loading inicial                | Skeleton mínimo do hero ou fade do fundo — nunca ecrã branco longo |
| Sucesso de navegação           | Transição para Auth / Explorar                                     |
| Erro de navegação (futuro)     | Toast / mensagem sóbria                                            |
| Offline (futuro)               | Banner discreto                                                    |
| Visitante autenticado (futuro) | Redirect para app — fora do âmbito de UI deste passo               |

---

## 12. Acessibilidade

- Contraste AA em texto e CTAs.
- Ordem de foco lógica: logo → Entrar → Começar → Explorar → secções.
- Textos alternativos na imagem de hero (ex.: “Ambiente residencial contemporâneo em Angola”).
- Headings hierárquicos `h1` único no hero.
- CTAs como botões/links reais, não `div` clicável.

---

## 13. Estrutura técnica (especificação — sem implementação)

> Apenas para orientar a FASE de implementação futura. **Não implementar agora.**

### 13.1 Localização prevista (Blueprint)

- App: `apps/web` (Next.js App Router)
- Rota: `/` (Landing pública)
- Componentes: `packages/ui` + secções em `apps/web/modules/landing` ou `app/(marketing)/`

### 13.2 Dependências de design

- Tokens Tailwind = Design System (Orange, Slate, escala)
- Tipografia Inter + JetBrains Mono (se houver IDs na página — preferir não no hero)

### 13.3 Analytics (futuro)

Eventos a instrumentar depois:

- `landing_view`
- `cta_comecar_click`
- `cta_explorar_click`
- `cta_entrar_click`
- `scroll_diferenca` / `scroll_como_funciona`

### 13.4 Critérios de performance (na implementação)

- LCP hero otimizado
- Sem JS pesado desnecessário na Landing
- Imagens compressed / responsive

---

## 14. Critérios de sucesso da página

| Métrica / critério             | Alvo                                                |
| ------------------------------ | --------------------------------------------------- |
| Compreensão do propósito       | ≤ 3 segundos (teste qualitativo com 5 utilizadores) |
| Identificação do CTA principal | ≥ 90% dos testados apontam “Começar” sem ajuda      |
| Taxa de rejeição por confusão  | Baixa (feedback “parece anúncios?” &lt; 20%)        |
| Consistência visual            | 100% alinhamento ao Design System / PASSO 0         |
| Mobile                         | Fluxo completo utilizável só com polegar            |
| Acessibilidade                 | Sem bloqueios críticos WCAG 2.2 AA                  |

---

## 15. Wireframe descritivo (baixo nível)

### Mobile — first screen

```
[ Kuteka          Começar ]
--------------------------------
Património. Confiança. Habitação.

A plataforma que protege, valoriza
e acompanha o seu património...

[        Começar         ]
[        Explorar        ]
--------------------------------
(fundo atmosférico discreto)
```

### Mobile — abaixo

```
Porque a Kuteka é diferente
[ícone] Confiança verificável
[ícone] Património, não só imóveis
[ícone] Transparência total

Como funciona
1 Descobrir
2 Confiar
3 Activar
[ Começar ]

Fecho + CTA
Footer
```

### Desktop — first screen

```
[ Kuteka                    Entrar  Começar ]
------------------------------------------------------------
|                                              |
|  Património. Confiança. Habitação.           |
|  subtítulo...                                |
|  [Começar]  [Explorar]                       |
|                                              |
|           (atmosfera full-bleed)             |
------------------------------------------------------------
```

---

## 16. Riscos e decisões abertas

| Risco / questão                     | Proposta                                                                                          | Precisa decisão?      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------- |
| Imagem de hero                      | Usar fotografia realista de contexto angolano / património; evitar stock genérico óbvio           | Sim, na implementação |
| Domínio “Explorar” ainda não existe | CTA pode apontar para âncora `#diferenca` temporariamente **ou** ficar preparado para `/explorar` | Sim                   |
| Logótipo final                      | Usar wordmark Kuteka até asset oficial consolidado                                                | Não bloqueia spec     |
| Idioma EN/FR                        | Fora da v1                                                                                        | Não                   |

**Sugestão de produto (melhoria):**  
No MVP, **Explorar** pode fazer scroll até “Porque somos diferentes” + “Como funciona” se a listagem pública ainda não existir — evita CTA morto. Confirmar na aprovação.

---

## 17. Critérios de Aprovação

Este documento só está **pronto para implementação** quando todos os itens seguintes forem verdadeiros:

- [ ] A Landing comunica claramente o propósito da Kuteka em menos de 3 segundos.
- [ ] O utilizador consegue identificar a principal ação da página (**Começar**) sem esforço.
- [ ] Existe um caminho secundário claro (**Explorar**) sem competir com o CTA principal.
- [ ] A identidade visual descrita está alinhada com o Design System e o PASSO 0 (Orange, Slate, Inter, espaço, tom).
- [ ] A página transmite confiança, profissionalismo e modernidade — sem parecer marketplace de anúncios.
- [ ] A diferenciação (“Porque somos diferentes”) está presente, simples e limitada a 3 ideias.
- [ ] A experiência está definida de forma consistente para desktop, tablet e mobile.
- [ ] Animações e microinterações estão limitadas (&lt; 250 ms) e acessíveis.
- [ ] A linguagem usa apenas terminologia oficial (sem “senhorio”, sem “publicar anúncio” como conceito central).
- [ ] O âmbito está claro: **sem código** até aprovação; sem misturar Auth/Dashboards neste passo.
- [ ] O documento está pronto para implementação **sem ambiguidades** (estrutura, textos, CTAs e comportamentos definidos).

---

## 18. Próximo passo após aprovação

1. Revisão conjunta deste PASSO 1.
2. Ajustes pontuais (se necessários).
3. Aprovação explícita.
4. **Só então** — ou avançar para FASE 1 Infraestrutura (monorepo), ou implementar a Landing quando a fundação técnica existir, conforme a ordem que a equipa priorizar.

**Recomendação de arquitectura:**  
Concluir **FASE 1 — Infraestrutura** (Next.js + Tailwind + Design System base) **antes** de implementar visualmente a Landing, para não reconstruir a página no stack legado Vite. A especificação deste PASSO 1 permanece válida e torna-se o contrato de implementação.

---

_Documento oficial Kuteka — PASSO 1 · Landing Page · Aguarda aprovação._
