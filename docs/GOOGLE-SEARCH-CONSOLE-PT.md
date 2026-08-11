# Google Search Console — verificar o Remake Pixel

## O que o agente fez no site (SEO)

Isto **não** é o Search Console. No código ficou:

- Textos em inglês para o Google (`title`, `description`, Open Graph)
- `https://remakepix.com/robots.txt` e `https://remakepix.com/sitemap.xml`
- Dados estruturados (JSON-LD) na home e FAQ em `/discover`
- `/app/` bloqueado para indexação (área com login)

O Search Console é **só a tua conta Google** para ver pesquisas e enviar o sitemap. Tens de **provar que és dono** do site — passo à parte.

---

## Porque apareceu “Falha na verificação”

Escolheste (ou o assistente sugeriu) verificação por **provedor de domínio** / **registo TXT no DNS**.

O Google procura um registo **TXT** em `remakepix.com` com um código tipo:

`google-site-verification=XXXXXXXX`

Se esse TXT **não foi criado** no painel onde compraste o domínio (Cloudflare, Namecheap, GoDaddy, etc.), a verificação **falha sempre** — mesmo com o site perfeito.

---

## Método mais fácil (recomendado): Prefixo do URL + etiqueta HTML

### 1. Abrir o Search Console

https://search.google.com/search-console

### 2. Adicionar propriedade — escolhe **Prefixo do URL**

| Opção | O que pões |
|--------|------------|
| **Prefixo do URL** | `https://remakepix.com` |
| ~~Domínio~~ | ~~remakepix.com~~ (evita — obriga TXT no DNS) |

Clica **Continuar**.

### 3. Verificação — escolhe **Etiqueta HTML**

O Google mostra algo como:

```html
<meta name="google-site-verification" content="CODIGO_AQUI_123456" />
```

Copia só o valor de `content` (o código longo).

### 4. Colocar o código no projeto

**Opção A — Vercel (sem editar ficheiros)**

1. Vercel → projeto **remakepix** → **Settings** → **Environment Variables**
2. Nome: `REACT_APP_GOOGLE_SITE_VERIFICATION`
3. Valor: o código que copiaste (só o código, sem aspas)
4. Environment: Production (e Preview se quiseres)
5. **Redeploy** do site

O build injeta automaticamente a meta tag em `index.html`.

**Opção B — Ficheiro HTML (alternativa)**

1. No Search Console, escolhe método **Ficheiro HTML**
2. Descarrega o ficheiro (ex.: `google123abc.html`)
3. Coloca em `frontend/public/google123abc.html` no repo
4. Commit, push, deploy
5. Abre no browser: `https://remakepix.com/google123abc.html` — tem de abrir sem erro 404

### 5. Verificar no Google

Clica **Verificar**. Se falhar, espera 5–10 minutos após o deploy e tenta outra vez.

### 6. Enviar o sitemap

Depois de verificado:

1. Menu **Sitemaps**
2. URL: `https://remakepix.com/sitemap.xml`
3. **Enviar**

---

## Se quiseres mesmo verificação por domínio (TXT)

1. Search Console → propriedade de **domínio** `remakepix.com`
2. Copia o registo **TXT** que o Google indica
3. No DNS do domínio (onde está `remakepix.com`), adiciona:
   - Tipo: **TXT**
   - Nome/Host: `@` ou vazio (depende do painel)
   - Valor: o texto completo que o Google deu
4. Guarda e espera **1–48 h** (propagação DNS)
5. Clica **Verificar** outra vez

Ferramenta para testar: https://dnschecker.org (procurar TXT em `remakepix.com`)

---

## Resumo

| Problema | Solução |
|----------|---------|
| Falha com provedor de domínio | Usar **Prefixo do URL** + **Etiqueta HTML** ou **Ficheiro HTML** |
| Não sei o que o agente fez | SEO no site já está; falta só verificar a propriedade no Google |
| Sitemap | Só depois de verificado: `sitemap.xml` |

Se enviares o código da etiqueta HTML (o `content`), podes pedir para alguém configurar a variável na Vercel por ti.
