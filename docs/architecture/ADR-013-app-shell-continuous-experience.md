# ADR-013 — App Shell contínuo (experiência tipo LinkedIn)

**Data:** 2026-08-01  
**Estado:** Aceite  
**Prioridade:** Máxima — arquitectura definitiva da plataforma autenticada

## Contexto

A plataforma ainda se sentia como páginas distintas (Início → Patrimónios → Habitação). O feed estava enterrado sob um dashboard. O documento fazia scroll com a nav. A referência passa a ser uma aplicação moderna (LinkedIn / Facebook / Airbnb / Notion): chrome permanente, só o centro scrolla, feed contínuo.

## Decisão

1. **Frame de aplicação** (`h-dvh` + `overflow: hidden`):
   - Esquerda: nav permanente (não scrolla com o conteúdo).
   - Topo: header permanente (não scrolla).
   - Centro: única região com `overflow-y: auto`.
2. **Atmosfera estável** no workspace: um único preset (`dashboard`), sem vídeo, sem troca por rota — evita sensação de “página nova” e alivia CPU/GPU.
3. **Sem ModuleIntro por rota** no shell — o centro muda; o chrome não.
4. **Home = Feed**: scroll contínuo infinito com marcadores temáticos inline + cartões; paginação Supabase (`range`) + infinite scroll + `content-visibility` para escala.
5. **Módulos** partilham o mesmo frame; só `{children}` no painel scrollável muda.

## Escala

Preparação para dezenas/centenas de milhares de anúncios:

- Paginação server-side (não `.limit(200)` único).
- Infinite scroll com sentinel.
- `content-visibility: auto` nos itens do feed.
- Imagens `loading="lazy"`; sem vídeo de fundo na app.
- Refresh de sessão silencioso (ADR / RENDER_STABILITY).

## Consequências

- Landing mantém hero cinematográfico; a app autenticada é um ambiente de trabalho contínuo.
- Novos módulos devem apenas preencher o painel central — nunca reinventar nav/header/atmosfera.
- Virtualização DOM adicional (`@tanstack/react-virtual`) pode entrar quando o volume em memória o justificar; a API de páginas já está pronta.

## Alternativas rejeitadas

| Alternativa                        | Motivo                                    |
| ---------------------------------- | ----------------------------------------- |
| Feed como secção no fim do Início  | Não é a plataforma — é um widget          |
| Trocar atmosfera por módulo        | Particiona a experiência em “páginas”     |
| Carregar 200+ linhas de uma vez    | Não escala; pesa CPU/memória              |
| Document scroll com sticky parcial | Nav/header ainda “viajam”; não parece app |
