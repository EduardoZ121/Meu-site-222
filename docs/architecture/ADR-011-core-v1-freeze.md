# ADR-011 — Congelamento Kuteka Platform Core v1.0

**Estado:** Aceite · 2026-08-01  
**Contexto:** O núcleo MVP (Landing → Auth → Shell → Patrimónios → Habitação → Agente → Admin → Confiança → Premium Experience) atingiu qualidade suficiente para baseline comercial.

## Decisão

1. Congelar oficialmente o **Kuteka Platform Core v1.0** conforme `docs/product/KUTEKA_PLATFORM_CORE_V1.md`.
2. Tratar a Premium Experience Directive como parte da identidade permanente do Core.
3. Qualquer expansão (Contratos, Pagamentos, Wallet, Passaporte, Academia, CRM, KAI) ocorre **após** auditoria de maturidade e **sem** reabrir a arquitectura Core salvo ADR de versão.
4. Hardening de segurança encontrado na auditoria Core (ex.: RLS de interesses, scope de RPCs RBAC) é considerado manutenção do Core v1.0, não feature nova.

## Consequências

- Product Owners e engenharia usam o Core v1.0 como referência de demo e due diligence.
- Evitam-se ciclos de refactor estrutural nos módulos congelados durante a expansão.
- Dívida técnica documentada no relatório de maturidade é priorizada antes de beta pública.
