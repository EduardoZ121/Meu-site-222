# Background Generation Update — 9 ficheiros

## O que mudou
Sistema de gerações em segundo plano. Ao clicar Generate, o utilizador recebe
toast "vamos avisar quando terminar". Pode sair, recarregar e navegar — o
resultado aparece na galeria + bip + notificação quando estiver pronto.

## Como aplicar
Substitui os 9 ficheiros nos caminhos abaixo (estrutura preservada):

- frontend/src/lib/bgGeneration.js    (NOVO)
- frontend/src/lib/api.js             (interceptor → background)
- frontend/src/pages/dashboard/Generate.jsx
- frontend/src/pages/dashboard/Posters.jsx
- frontend/src/pages/dashboard/VideoEditorAdmin.jsx
- frontend/src/pages/dashboard/Artistic.jsx
- frontend/src/pages/dashboard/Pro.jsx
- frontend/src/pages/dashboard/VideoGenerate.jsx
- frontend/src/components/manga-flow/GenerationModal.jsx

## Não precisa de novas dependências.
Validação: `cd frontend && yarn build` tem de passar verde.

## NÃO foi tocado
- frontend/src/pages/dashboard/Carousel.jsx — multi-step, mantém polling sync.
- frontend/src/lib/NotificationContext.jsx — bip e store já feitos.
- frontend/src/lib/notifyUser.js — eventos já feitos.
