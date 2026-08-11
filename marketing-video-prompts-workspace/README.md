# Workspace — Prompts Vídeos de Marketing com IA

Pasta para editares os **prompts ocultos** antes de integrarmos no site.

## Estrutura

```
marketing-video-prompts-workspace/
├── index.html              ← índice (abrir no browser)
├── README.md               ← este ficheiro
├── shared/
│   └── styles.css
├── fashion/index.html
├── drinks/index.html
├── cars/index.html
├── cosmetics/index.html
├── websites/index.html
├── food/index.html
├── jewelry/index.html
├── realEstate/index.html
└── gaming/index.html
```

## Como editar

1. Abre cada `index.html` no **Cursor** ou no **browser** (duplo clique).
2. Preenche entre **3 e 10 prompts** por categoria (podes apagar slots vazios).
3. Cada prompt tem:
   - **id** — identificador único (ex.: `fashion_hero_pan_01`)
   - **durations** — segundos permitidos: `4, 6, 10, 15` (ou subset)
   - **weight** — prioridade (número maior = preferido)
   - **storyboard** — conceito interno (1–3 frases)
   - **prompt** — prompt completo Seedance 2.0 (oculto para o utilizador)

## Placeholders de imagens

| Token | Significado |
|-------|-------------|
| `[Image1]` | 1.ª imagem = produto/serviço principal |
| `[Image2]` … `[Image6]` | Referências (ângulos, branding, contexto) |

## Especificações do vídeo (fixas no site)

- Formato **9:16** vertical
- Máximo **15 segundos**
- Estilo profissional, cinematográfico, transições suaves
- Sem texto overlay nem watermark (salvo branding nas refs)

## Quando terminares

Volta ao chat e envia o caminho desta pasta, por exemplo:

`C:\Users\eduar\OneDrive\Desktop\Meu-site-222\marketing-video-prompts-workspace`

Eu leio os HTML, integro em `frontend/api/lib/marketingVideo/marketingVideoPrompts.cjs` e ajusto o que for preciso.
