# Login Google bloqueado — o que fazer

O erro **“Google bloqueou” / “Access blocked”** aparece **no ecrã da Google**, antes do teu site receber qualquer pedido. **Não tem relação com Blob, AWS ou upload.**

## Causas mais comuns (99%)

### 1. App OAuth em modo **Teste**

[Google Cloud Console](https://console.cloud.google.com/) → **APIs e serviços** → **Ecrã de consentimento OAuth**

- Se o estado for **Em teste**, só os emails em **Utilizadores de teste** conseguem entrar.
- **Outras contas** veem “Acesso bloqueado” ou “app não concluiu a verificação”.

**Solução A (rápida):** Em **Utilizadores de teste**, adiciona o teu Gmail (e o de quem for testar).

**Solução B (site público):** Publicar a app → **Publicar app** (para poucos scopes básicos email/perfil muitas vezes basta; a Google pode pedir verificação se pedires scopes sensíveis).

### 2. **Origens JavaScript** em falta

**APIs e serviços** → **Credenciais** → o teu **ID de cliente OAuth 2.0** (tipo “Aplicação Web”)

Em **Origens JavaScript autorizadas**, tens de ter **as duas** (com `https://`):

```
https://remakepix.com
https://www.remakepix.com
```

Opcional para pré-visualizações Vercel:

```
https://remakepix-eduardozola1998-1779s-projects.vercel.app
```

**Sem barra no fim.** Se só tiveres `www` e abrires `remakepix.com`, a Google bloqueia.

### 3. Client ID errado no projeto Vercel

O site usa `REACT_APP_GOOGLE_CLIENT_ID` no build.

- Variável tem de estar no projeto **remakepix** (não no clone `meu-site-222`).
- Depois de alterar → **Redeploy** em Production.

Client ID actual no site (público no JS): termina em `...apps.googleusercontent.com` — confirma que é o mesmo no Google Cloud.

### 4. Não é o mesmo problema que upload

| Sintoma | Causa |
|---------|--------|
| Popup Google “bloqueado” | Google Cloud (consentimento / origens) |
| Foto / upload failed | Vercel 4,5 MB / compressão / S3 |
| Site em branco | Bug de código / projeto Vercel errado |

---

## Ordem recomendada (5 minutos)

1. Abre o site em **https://www.remakepix.com/login** (usa sempre `www` enquanto o domínio raiz não estiver igual).
2. Google Cloud → Credenciais → confirma **origens** (lista acima).
3. Ecrã de consentimento → adiciona o teu email em **Utilizadores de teste** OU publica a app.
4. Guarda → espera 1–2 min → janela anónima → tenta login outra vez.

---

## Se a mensagem for “This app isn’t verified”

- Para ti e testers: **Avançadas** → **Ir para Remake Pixel (não seguro)** — só enquanto estiver em teste.
- Para clientes em massa: completar verificação OAuth na Google (processo separado, demorado).

---

## Testar se o backend está OK

```bash
curl -X POST https://www.remakepix.com/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"x"}'
```

Resposta esperada: `Credencial Google inválida` (401) — significa que a **API funciona**; o bloqueio é só no popup Google.
