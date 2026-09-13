> **Legado Vite — não usar para produto KEOS.** Auth oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`.

﻿# Deploy Kuteka (Render)

## Servicos

| Servico    | URL                             | Tipo          |
| ---------- | ------------------------------- | ------------- |
| kutekalink | https://kutekalink.com          | Static (Vite) |
| kuteka-api | https://kuteka-api.onrender.com | Node API      |

Push para main = auto-deploy.

## Secrets no Render (kuteka-api)

MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, RESEND_API_KEY, AWS_*

Sem MONGODB_URI o site funciona em modo demo (localStorage).

## Verificacao pos-deploy

- https://kutekalink.com/inicio
- https://kuteka-api.onrender.com/api/health
