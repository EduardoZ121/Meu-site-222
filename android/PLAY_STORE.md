# RemakePix — Android (Google Play)

App **Trusted Web Activity (TWA)** que abre `https://www.remakepix.com` como app nativa.

| Campo | Valor |
|-------|-------|
| Package | `com.remakepix.app` |
| Launch URL | `https://www.remakepix.com/login?source=android_app` |
| Conta Play Console | `eduardozola121998@gmail.com` |

## Ficheiro para upload na Play Store

```
android/app/build/outputs/bundle/release/app-release.aab
```

Copia também para `android/release/app-release-v1.0.0.aab` após cada build de release.

## Build local (Windows)

Pré-requisitos: Android Studio (JDK em `jbr`) + Android SDK.

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew.bat bundleRelease
```

## Keystore (IMPORTANTE — guardar backup)

- Ficheiro: `android/remakepix-release.keystore` (não vai para git)
- Credenciais: `android/keystore.properties` (não vai para git)

**Sem este keystore não consegues publicar updates.** Guarda cópia num local seguro (OneDrive encriptado, gestor de passwords, etc.).

## Digital Asset Links (TWA)

Ficheiro servido em produção:

`https://www.remakepix.com/.well-known/assetlinks.json`

SHA-256 do certificado de release (atual):

```
56:7B:BC:6F:A0:E0:AB:C8:A5:9A:40:17:68:D0:49:13:34:70:CE:AE:42:46:E5:40:88:EC:CC:57:95:77:F2:6F
```

Se regenerares o keystore, atualiza `assetlinks.json` e faz deploy do frontend.

## Ícones

```powershell
node android/scripts/generate-icons.cjs
```

Gera ícones web (`frontend/public/icon-*.png`) e mipmaps Android.

## Play Console — checklist após verificação de identidade

1. **Criar app** → nome *RemakePix*
2. **Produção / Teste fechado** → upload do `.aab`
3. **Ficha da loja**: título, descrição curta/longa, ícone 512×512 (`icon-512.png`), feature graphic 1024×500
4. **Política de privacidade**: `https://www.remakepix.com/legal/privacy`
5. **Classificação de conteúdo** — questionário IARC
6. **Público-alvo** — idade mínima
7. **Teste fechado** (contas novas pós-2023): mín. 12 testers × 14 dias antes de produção
8. **Data safety** — declarar dados recolhidos (email, imagens upload, pagamentos futuros)

## Fase 2 — Google Play Billing

Pagamentos in-app via Play Billing (não Google Pay). Integrar com o sistema de créditos existente quando a app estiver na loja.

## Screenshots sugeridos

Captura no telemóvel ou emulador: login, dashboard, gerador de imagem, vídeo marketing. Mínimo 2 screenshots por form factor (telefone 16:9 ou 9:16).
