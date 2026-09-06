# Polimento Premium — UX/UI

**Data:** 2026-08-01  
**Branch / entrega:** migração `0013_premium_listing_reputation.sql` + ficha partilhada + dashboards por papel

## Problema corrigido (crítico)

Texto da ficha do imóvel (`text-slate-900` / `text-slate-500`) flutuava sobre a atmosfera escura → ilegível.  
**Solução:** painéis `.kuteka-detail-panel` (fundo claro `#fffdf8`, tinta `#0f172a`, acentos dourados, preço azul) com contraste AA/AAA.

## Ficha premium partilhada

`PropertyShowcase` (Habitação + Patrimónios):

1. Galeria
2. Factos / descrição / comodidades / media slots
3. Mapa OSM (exacto ou zona aproximada)
4. Linha temporal
5. Reputação (avaliações pós-contrato)

## Reputação

Tabela `contract_reviews` — sujeitos: imóvel, proprietário, agente, cliente, experiência.  
Demo seed em contrato `completed`.

## Dashboards por papel

`RoleHomeDashboard` no Início: Cliente · Parceiro · Agente · Admin · Superadmin (executivo).

## Contas demo (password `DemoKuteka2026!`)

| Email                      | Papel                               |
| -------------------------- | ----------------------------------- |
| demo.cliente@kuteka.local  | Cliente                             |
| demo.parceiro@kuteka.local | Parceiro Patrimonial                |
| demo.dual@kuteka.local     | Cliente + Parceiro (Mudar de papel) |
| demo.agente@kuteka.local   | Agente Certificado                  |
| demo.admin@kuteka.local    | Administrador                       |
| demo.super@kuteka.local    | Superadministrador                  |

## Aplicar migração

```bash
# no projecto Supabase ligado
supabase db push
# ou executar 0013_premium_listing_reputation.sql
# e garantir seed: select public.seed_premium_role_demos();
```

Sem a migração, o select enriquecido da ficha pode falhar até as colunas existirem.
