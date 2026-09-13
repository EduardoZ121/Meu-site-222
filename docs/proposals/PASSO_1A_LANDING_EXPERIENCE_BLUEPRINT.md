# PASSO 1A — Landing Page Experience Blueprint

**Documento:** Blueprint de experiência da Landing Page  
**Versão:** 1.0  
**Estado:** Aprovado oficialmente · **Implementação encerrada**  
**Código:** Entregue em `apps/web` · Validação: `LANDING_FUNCTIONAL_VISUAL_VALIDATION.md`  
**Complementa:** `PASSO_1_LANDING_PAGE_SPEC.md`  
**Referências obrigatórias:**

- Manual Operacional da Kuteka
- Software Architecture Blueprint
- Design System & UX Blueprint (Nº 003)
- PASSO 0 — Identidade Oficial da Kuteka
- `docs/AI_CONTEXT.md`
- PASSO 1 — Especificação da Landing Page (aprovado)

**Sequência:** Especificação → Revisão → Aprovação → (depois) FASE 1 Infraestrutura → Implementação da Landing

---

## 1. Propósito deste blueprint

O PASSO 1 definiu **o quê** construir (estrutura, textos-base, CTAs, responsivo).  
O PASSO 1A define **como a experiência deve sentir-se e persuadir** — a história, a emoção, a hierarquia e as decisões que impedem que a Landing seja “só bonita”.

**Objectivo de produto:**  
Uma Landing que, no primeiro contacto, posicione a Kuteka como **PropTech africana de património e confiança**, pronta para durar anos — não como um site de anúncios moderno.

---

## 2. A história que a Landing deve contar

### 2.1 Arco narrativo (story arc)

A Landing conta uma história em quatro actos:

| Acto | Nome               | Mensagem                                       |
| ---- | ------------------ | ---------------------------------------------- |
| I    | **Reconhecimento** | “Isto não é mais um site de casas.”            |
| II   | **Significado**    | “Aqui trata-se de património e confiança.”     |
| III  | **Diferença**      | “Há um modo mais transparente e profissional.” |
| IV   | **Convite**        | “Podes começar agora — com clareza.”           |

### 2.2 História em uma frase

> Em Angola, o património imobiliário merece mais do que anúncios: merece confiança, transparência e uma plataforma construída para o futuro.

### 2.3 História expandida (voz da marca)

O visitante chega cansado de informação opaca e processos informais.  
A Kuteka apresenta-se como parceira tecnológica: protege, valoriza e acompanha património.  
Não pede fé cega — mostra pilares de confiança e um caminho simples: Descobrir → Confiar → Activar.  
O convite final não é “apertar para comprar”; é **começar uma relação séria** com a plataforma.

### 2.4 O que a história nunca conta

- Urgência artificial (“últimas vagas”, contadores).
- Promessas de lucro milagroso.
- Comparações agresivas com concorrentes nomeados.
- Feature lists intermináveis.
- “Marketplace de anúncios com IA” como identidade.

---

## 3. Sequência emocional (do 1.º segundo ao CTA)

### 3.1 Linha do tempo emocional

| Tempo               | O que vê                                      | O que deve sentir        | Resultado cognitivo      |
| ------------------- | --------------------------------------------- | ------------------------ | ------------------------ |
| **0–1 s**           | Marca + atmosfera premium                     | Respeito, calma          | “Isto parece sério.”     |
| **1–3 s**           | Headline: _Património. Confiança. Habitação._ | Clareza                  | “Já sei o que é.”        |
| **3–8 s**           | Subtítulo + CTAs                              | Confiança + convite      | “Sei o que fazer.”       |
| **8–20 s** (scroll) | Porque somos diferentes                       | Curiosidade fundamentada | “Não é um classificado.” |
| **20–40 s**         | Como funciona                                 | Orientação               | “O caminho é simples.”   |
| **CTA click**       | Começar / Explorar                            | Progresso sem ansiedade  | “Avancei com intenção.”  |

### 3.2 Emocões permitidas

Calma · confiança · respeito · curiosidade · esperança sóbria · controlo.

### 3.3 Emocões proibidas

Pressão · confusão · FOMO · infantilidade · frieza tecnológica · desconfiança por excesso de marketing.

### 3.4 Momento crítico

Se aos **3 segundos** o visitante ainda pensa “é um Idealista angolano”, a Landing falhou — independentemente da beleza visual.

---

## 4. Hierarquia visual por secção

### 4.1 Princípio geral

Hierarquia = **tipografia + espaço + cor pontual**, não caixas a competir.

Ordem de peso visual na página:

1. Headline do hero
2. CTA primário (Orange)
3. Marca Kuteka
4. Subtítulo
5. CTA secundário
6. Títulos de secção
7. Corpo e ícones
8. Footer

### 4.2 Secção A — Topbar

- **Peso:** baixo (não compete com hero).
- Logo legível; link `Entrar` secundário; `Começar` compacto.
- Fundo: transparente → glass discreto ao scroll.
- Altura contida; sem menus densos.

### 4.3 Secção B — Hero

- **Peso:** máximo.
- `h1` dominante (clamp tipográfico generoso).
- Subtítulo com contraste menor (Slate).
- CTAs: primário Orange sólido; secundário outline/ghost.
- Fundo atmosférico atrás — nunca um card inset com a imagem.
- Nenhum elemento flutuante (badges, chips, stats) sobre o hero.

### 4.4 Secção C — Diferença

- **Peso:** médio.
- Título de secção claro.
- Três blocos iguais em peso (sem “card vencedor”).
- Ícone pequeno + título + uma frase — ar entre blocos (24–32).
- Sem bordas pesadas; separação por espaço.

### 4.5 Secção D — Como funciona

- **Peso:** médio-baixo.
- Numeração discreta (1·2·3) em mono ou tabular.
- Ligação visual simples entre passos (linha ou só ritmo).
- CTA de reforço alinhado ao fim.

### 4.6 Secção E — Fecho

- **Peso:** médio (último impulso).
- Uma frase + um CTA.
- Fundo ligeiramente mais denso (Slate) ou contraste suave — sem gritaria.

### 4.7 Secção F — Footer

- **Peso:** mínimo.
- Tipografia pequena; links claros; sem mapa do site gigante.

---

## 5. Racional de cada bloco

| Bloco                 | Porque existe                           | Se removermos…                         |
| --------------------- | --------------------------------------- | -------------------------------------- |
| Topbar                | Orientação e acesso a quem já tem conta | Visitante perdido; retorno dificultado |
| Hero                  | Cumprir a missão dos 3 segundos         | Página sem propósito                   |
| Diferença (3 pilares) | Separar da lógica de anúncios           | Kuteka parece classificado “bonito”    |
| Como funciona         | Reduzir medo do desconhecido            | Curiosidade sem caminho                |
| Fecho CTA             | Recuperar indecisos após scroll         | Queda de conversão no fundo            |
| Footer                | Confiança institucional / legal         | Sensação de site incompleto            |

**Regra:** cada bloco tem uma missão. Se um bloco não mudar a compreensão ou a decisão, não entra.

---

## 6. Mensagens principais e secundárias

### 6.1 Mensagem principal (Primary message)

**Património. Confiança. Habitação.**

Função: posicionamento instantâneo. Três palavras = três pilares da missão.

### 6.2 Mensagem de apoio (Secondary message)

**A plataforma que protege, valoriza e acompanha o seu património imobiliário — com transparência e profissionalismo.**

Função: explicar o “como” sem feature dump.

### 6.3 Mensagem de diferenciação

**Não somos um site de anúncios. Somos uma plataforma de património e confiança.**

Função: corte cognitivo claro com o mercado tradicional.

### 6.4 Mensagens terciárias (pilares)

1. Confiança verificável
2. Património, não só imóveis
3. Transparência total

### 6.5 Mensagem de caminho

**Descobrir → Confiar → Activar**

Função: transformar abstracção em percurso.

### 6.6 Mensagem de fecho

**Construída para durar — com confiança, tecnologia e excelência operacional.**

Função: visão de longo prazo (Manual + Blueprint).

---

## 7. Headlines e subheadlines (sugestões)

### 7.1 Hero — opção oficial (aprovada no PASSO 1)

- **H1:** Património. Confiança. Habitação.
- **Sub:** A plataforma que protege, valoriza e acompanha o seu património imobiliário — com transparência e profissionalismo.

### 7.2 Alternativas de H1 (só se a revisão pedir variação)

| Alternativa                                | Quando usar                         |
| ------------------------------------------ | ----------------------------------- |
| A. `Confiança para o seu património.`      | Tom mais directo                    |
| B. `Habitação com transparência.`          | Ênfase Cliente                      |
| C. `Onde o património encontra confiança.` | Tom mais poético (usar com cautela) |

**Recomendação:** manter a opção oficial do PASSO 1 — é a mais alinhada ao PASSO 0 e a mais memorável.

### 7.3 Secção diferença

- **H2:** Porque a Kuteka é diferente
- **Intro:** Não somos um site de anúncios. Somos uma plataforma de património e confiança.

### 7.4 Como funciona

- **H2:** Como funciona
- Passos: Descobrir · Confiar · Activar (com microcopy do PASSO 1)

### 7.5 Fecho

- **H2 / frase:** Construída para durar — com confiança, tecnologia e excelência operacional.

---

## 8. Estratégia dos CTAs

### 8.1 Modelo psicológico

| CTA          | Intenção do utilizador  | Fricção               | Papel                            |
| ------------ | ----------------------- | --------------------- | -------------------------------- |
| **Começar**  | Quero entrar no sistema | Média (auth a seguir) | Conversão primária               |
| **Explorar** | Quero perceber antes    | Baixa                 | Reduz medo; alimenta curiosidade |
| **Entrar**   | Já tenho conta          | Baixa                 | Retenção / retorno               |

### 8.2 Hierarquia

1. **Começar** — único botão Orange sólido no hero.
2. **Explorar** — secundário; nunca mesma ênfase visual.
3. **Entrar** — terciário (texto).

### 8.3 Copy dos CTAs

- Preferir verbos de progresso: Começar, Explorar, Entrar.
- Evitar: “Registar grátis!”, “Ver ofertas”, “Publicar já”.

### 8.4 Estratégia se Explorar ainda não tiver listagem

**Recomendação oficial deste blueprint:**  
Enquanto `/explorar` não existir, **Explorar** faz scroll suave até a secção “Porque somos diferentes” (e opcionalmente “Como funciona”).  
Assim o CTA nunca está morto e cumpre a função emocional de “perceber mais”.

Quando a exploração pública existir, o mesmo label aponta para `/explorar` sem mudar a hierarquia visual.

### 8.5 Densidade

- Hero: 2 CTAs máximo.
- Fecho: 1 CTA (`Começar`).
- Sem sticky CTA bar agressiva na v1 (pode reconsiderar só com dados reais).

---

## 9. Elementos de confiança

### 9.1 Pilares de confiança na Landing v1

| Tipo                  | Como aparece                                    | Nota                          |
| --------------------- | ----------------------------------------------- | ----------------------------- |
| **Transparência**     | Frase de diferenciação + pilar 3                | Confiança por clareza         |
| **Segurança**         | Tom institucional; Termos/Privacidade no footer | Confiança jurídica            |
| **Diferenciação**     | “Não somos um site de anúncios…”                | Confiança de posicionamento   |
| **Processo**          | Descobrir → Confiar → Activar                   | Confiança por previsibilidade |
| **Identidade visual** | Orange/Slate, espaço, tipografia                | Confiança estética premium    |

### 9.2 Social proof na v1

**Não fabricar.**  
Sem “+10 000 utilizadores”, estrelas inventadas ou logos de parceiros não confirmados.

**Social proof permitido (quando real):**

- Menção sóbria a verificação de processos.
- Futuro: selos SCK, scores médios reais, casos verificados.

### 9.3 Confiança “premium” vs confiança “barulhenta”

Preferimos silêncio elegante + precisão  
em vez de badges, carrosséis de testemunhos e contadores.

---

## 10. Iconografia, imagens e estilo visual

### 10.1 Iconografia

- Set único, geométrico, traço consistente (24 px base).
- Três ícones dos pilares: confiança (escudo/verificação), património (estrutura/activo), transparência (documento/clareza).
- Sem emoji.
- Cor: Slate; hover pode usar Orange pontual.

### 10.2 Imagem de hero

**Intenção:** atmosfera de património contemporâneo africano / angolano — luz natural, arquitectura digna, sensação de lugar real.

**Evitar:**

- Stock genérico europeu óbvio;
- Collage de casas;
- Pessoas a apontar para laptops em stock poses;
- Filtros neon / cyberpunk.

**Tratamento:** overlay gradiente Slate escuro → transparente, para legibilidade do texto branco/claro. Orange só nos CTAs, não no overlay inteiro.

### 10.3 Estilo visual (síntese PASSO 0 + DS)

- Clean, muito espaço, poucas cores.
- Glassmorphism **mínimo** (topbar ao scroll).
- Cards da secção diferença quase “sem card” — ou card muito leve.
- Sensação 2030: tipografia forte, composição respirada, zero ruído.

### 10.4 Fotografia vs ilustração

v1: **fotografia atmosférica** no hero.  
Ilustrações custom: só se reforçarem África + património + modernidade sem infantilizar — não obrigatórias na v1.

---

## 11. Animações e microinterações

| Momento                  | Intenção emocional | Spec                                                    |
| ------------------------ | ------------------ | ------------------------------------------------------- |
| Load do hero             | Chegada calma      | Fade/slide curto do H1 → sub → CTAs (stagger ≤ 80 ms)   |
| Scroll reveal            | Continuidade       | Opacity 0→1 + 8–12 px Y; ≤ 250 ms                       |
| Hover CTA                | Afirmação          | Brightness/elevation discreta; ≤ 150 ms                 |
| Click Começar            | Compromisso        | Estado pressed; se rota lenta, spinner mínimo no botão  |
| Explorar (scroll)        | Descoberta         | Smooth scroll; highlight breve do título da secção alvo |
| Topbar on scroll         | Estabilidade       | Fundo glass em ≤ 150 ms                                 |
| `prefers-reduced-motion` | Inclusão           | Remover stagger e reveals                               |

**Proibido:** parallax forte, partículas, loaders de marca longos, animações que atrasam o LCP.

---

## 12. Comportamento desktop / tablet / mobile

### 12.1 Mobile first (experiência)

- Uma coluna; hero com CTAs empilhados.
- Polegar alcança Começar sem zoom.
- Diferença e passos em stack vertical com ritmo generoso.
- Topbar não come mais de ~56–64 px.

### 12.2 Tablet

- Transição: CTAs do hero podem ficar em linha.
- Três pilares em grelha se a largura permitir (≥ 2 colunas mínimas aceitáveis).

### 12.3 Desktop

- Hero full-bleed; texto com max-width ~40–45 ch para subtítulo.
- Composição única (não “dashboard”).
- Três pilares em 3 colunas.
- Como funciona em 3 colunas ou steps horizontais com números.

### 12.4 Continuidade

O **mesmo significado** em todos os tamanhos.  
Nunca esconder a diferenciação só no desktop.

---

## 13. Critérios de acessibilidade

- Contraste AA (texto sobre hero com overlay suficiente).
- Um único `h1`.
- Foco visível em todos os interactivos.
- Skip link “Ir para o conteúdo” (implementação futura).
- Alt text da imagem de hero descritivo e não keyword stuffing.
- CTAs com nomes acessíveis (`Começar`, não “botão 1”).
- Sem informação só por cor.
- Teste de teclado: Tab percorre topbar → CTAs → secções → footer.
- Motion reduzida respeitada.

---

## 14. SEO e performance (oportunidades)

### 14.1 SEO (preparação — sem over-optimization)

- Title: `Kuteka — Património. Confiança. Habitação.`
- Meta description: uma frase sobre PropTech / património / transparência em Angola.
- `h1` = headline oficial.
- URL canónica do domínio oficial.
- Open Graph com imagem atmosférica + título.
- JSON-LD Organization (futuro, quando dados legais estiverem fechados).
- Conteúdo único — não duplicar marketplaces.

### 14.2 Performance

- Hero image: formatos modernos, srcset, prioridade LCP.
- Fontes: Inter com subset / display swap.
- JS mínimo na Landing (Server Components quando existir Next).
- Sem carrosséis pesados.
- CLS: reservar espaço da topbar e tipografia.
- Meta alvo (implementação): LCP &lt; 2.5 s em 4G médio.

### 14.3 Longevidade SEO

Conteúdo baseado em **posicionamento**, não em buzzwords do ano.  
Evitar textos que envelhecem (“IA revolucionária 2026”).

---

## 15. Riscos de UX a evitar

| Risco                       | Porque é grave           | Mitigação                                          |
| --------------------------- | ------------------------ | -------------------------------------------------- |
| Parecer classificado        | Destrói o posicionamento | Mensagem de diferenciação + zero stats de anúncios |
| Hero sobrecarregado         | Falha nos 3 segundos     | Só marca, H1, sub, 2 CTAs                          |
| Muitos CTAs                 | Paralisia de escolha     | Hierarquia rígida                                  |
| Social proof falso          | Quebra confiança         | Proibir números inventados                         |
| Scroll infinito de features | Fadiga                   | Máx. secções do PASSO 1                            |
| CTA Explorar morto          | Frustração               | Scroll interno até listagem existir                |
| Copiar Airbnb/Idealista     | Perda de identidade      | Checklist visual do PASSO 0                        |
| Laranja em excesso          | Barulho                  | Orange só em acções primárias                      |
| Animação lenta              | Sensação de app pesada   | &lt; 250 ms                                        |
| Mobile “encolhido”          | Exclusão da maioria      | Desenhar mobile primeiro                           |

---

## 16. Recomendações para a Landing continuar actual durante anos

1. **Separar conteúdo de estrutura** — headlines e pilares em config/CMS leve no futuro; layout estável.
2. **Não acoplar a campanhas** — a home institucional não deve virar landing de Black Friday.
3. **Evoluir confiança com dados reais** — quando houver SCK/Score, entrar como módulos, não redesenhar a página.
4. **Manter o arco narrativo** — Reconhecimento → Significado → Diferença → Convite; novos blocos só se servirem o arco.
5. **Versionar a spec** — alterações de copy passam por revisão (este blueprint + PASSO 1).
6. **Medir poucos eventos** — view, Começar, Explorar, Entrar, profundidade de scroll.
7. **Design System como lei** — tokens mudam no sistema, não “à mão” na Landing.
8. **Idioma e expansão** — estrutura pronta para i18n sem redesign.
9. **Acessibilidade contínua** — auditorias em cada redesign menor.
10. **Resistir à tentação de features** — a Landing vende a visão; a App entrega o trabalho.

---

## 17. Relação com implementação (ordem oficial)

```
PASSO 1 (aprovado) + PASSO 1A (este documento)
        ↓
Aprovação do PASSO 1A
        ↓
FASE 1 — Infraestrutura (Next.js, TS, Tailwind, Supabase, DS base)
        ↓
Implementação da Landing (contrato = PASSO 1 + 1A)
        ↓
Testes → Validação
```

**Não implementar a Landing no protótipo Vite.**  
A fundação oficial vem primeiro.

---

## 18. Critérios de Aprovação

O PASSO 1A está pronto quando:

- [ ] A história da Landing está clara (arco Reconhecimento → Convite).
- [ ] A sequência emocional dos primeiros segundos até ao CTA está definida e alinhada ao PASSO 0.
- [ ] A hierarquia visual de cada secção está especificada sem ambiguidades.
- [ ] O racional de cada bloco está justificado (e o que não deve existir também).
- [ ] Mensagens principais/secundárias e headlines estão definidas.
- [ ] A estratégia de CTAs está clara, incluindo o comportamento temporário de **Explorar**.
- [ ] Elementos de confiança estão definidos **sem social proof fabricado**.
- [ ] Iconografia, imagem e estilo visual estão alinhados ao Design System e à Identidade Oficial.
- [ ] Animações, responsivo, acessibilidade, SEO e performance têm direcção objectiva.
- [ ] Riscos de UX estão listados com mitigações.
- [ ] Há recomendações explícitas de longevidade.
- [ ] O documento está pronto para orientar a FASE 1 e a futura implementação **sem código nesta fase**.

---

## 19. Pedido de aprovação

Com a sua aprovação do **PASSO 1A**, a equipa fica autorizada a avançar para a **FASE 1 — Infraestrutura** (ainda com especificação técnica curta dessa fase antes do código, se assim o exigir a Regra 1).

Se quiser ajustes de tom, história, CTAs ou hierarquia, indique-os antes da aprovação.

---

_Documento oficial Kuteka — PASSO 1A · Landing Page Experience Blueprint · Aguarda aprovação._
