# Estabilidade de render — causa raiz e regra

**Estado:** Obrigatório · 2026-08-01  
**Prioridade:** Máxima — bloqueia novos módulos até verificada em produção autenticada

## Causas raiz (confirmadas)

1. `AppShell.loadSession()` fazia `setSessionStatus('loading')` em **cada** chamada.
2. `onAuthStateChange` dispara `INITIAL_SESSION` / `TOKEN_REFRESHED` → nova `loadSession()`.
3. `SessionStatusGate` e hubs substituíam **toda** a árvore por `ModuleSkeleton` (pulse).
4. Com `session === null` durante o boot, `canManage`/`canExplore` eram `false` → **ForbiddenPanel** a aparecer e depois a desaparecer; a nav escondia itens e voltava a mostrá-los.
5. Detalhe: `if (loading) return <ModuleSkeleton />` desmontava o chrome da página.
6. Atmosfera / feed: fade de opacity e animações de entrada faziam conteúdo “piscar”.

## Correcções

| Camada            | Fix                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AppShell          | Stale-while-revalidate; nunca `loading` após primeira ready; cache `sessionStorage` (`kuteka-session-cache`) para permissões/perfil no 1.º paint; PlatformShell sempre montado com auth local |
| SessionStatusGate | Só parede de erro — sem skeletons                                                                                                                                                             |
| SoftListSlot      | Placeholder de altura fixa sem pulse; só no 1.º fetch sem dados                                                                                                                               |
| Hubs / detalhes   | Forbidden só com `status === 'ready' && !permission`; header estável; lista em SoftListSlot                                                                                                   |
| Nav               | Mantém últimas permissões conhecidas                                                                                                                                                          |
| Atmosfera / CSS   | Media a opacity 1; sem feed-in / pulse de conteúdo                                                                                                                                            |

## Regras permanentes

1. Após a primeira sessão pronta, **nunca** voltar `sessionStatus` a `loading`.
2. Não desmontar `PlatformShell` para ecrãs de «A carregar…» quando já há sessão.
3. Skeletons pulse **proibidos** como substituição de página; só SoftListSlot no primeiro fetch sem dados.
4. **Nunca** `ForbiddenPanel` enquanto `sessionStatus === 'loading'`.
5. Sem animações de entrada em feed/listas que alterem opacity/transform do conteúdo principal.
6. Relatório só pode dizer «corrigido» após verificação visual em produção autenticada (navegação por todos os módulos).

## Bloqueio de produto

Até o PO confirmar estabilidade em https://kutekalink.com: **sem** Wallet, Passaporte, Academia, CRM, KAI, Pagamentos ou outros módulos novos.
