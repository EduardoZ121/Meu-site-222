> **Legado Vite — não usar para produto KEOS.** Auth oficial: `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`.

# Google Login (Kuteka)

## 1. Google Cloud Console

1. Abra [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto (ex.: `kutekalink`)
3. **APIs e serviços → Credenciais → Criar credenciais → ID cliente OAuth**
4. Tipo: **Aplicação Web**
5. **Origens JavaScript autorizadas:**
   - `https://kutekalink.com`
   - `https://www.kutekalink.com` ← **obrigatório se usar www**
   - `http://localhost:5173` (desenvolvimento)
6. Copie o **Client ID**

## 2. Render (produção)

No serviço **kutekalink** → **Environment**:

```
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Faça **Manual Deploy** após guardar (a variável entra no build Vite).

## 3. Testar

- `/entrar` — botão **Continuar com Google**
- Após login → `/conta` com email e foto
- Notificações e emails demo ligados ao email Google

## Nota

Emails reais (SMTP) exigem backend numa fase seguinte. Por agora, o site regista a conta Google e simula envio na área **Minha conta**.
