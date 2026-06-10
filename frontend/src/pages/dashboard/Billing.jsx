import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { emitNotification } from "../../lib/notifyUser";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import {
  Sparkles, Zap, Rocket, Check, ArrowRight, Coins, Receipt, RefreshCw,
  TrendingUp, Plus, Minus, HelpCircle,
} from "lucide-react";
import { FALLBACK_PACKAGES } from "../../lib/publicFallbacks";
import { usePricing } from "../../lib/PricingContext";
import { setStoredPricingRegion } from "../../lib/pricingRegions";
import { BILLING_FAQ_KEYS, BILLING_PKG_KEYS } from "../../lib/billingLocales";
import { customPurchasePrice, getPricingMeta } from "../../lib/creditPricing";
import { resolveCanonicalOrigin } from "../../lib/canonicalOrigin";

const PKG_ICONS = { starter: Sparkles, creator: Zap, studio: Rocket, pro: Rocket };

export default function Billing() {
  const { t, lang } = useI18n();
  const faqs = useMemo(
    () => BILLING_FAQ_KEYS.map((k) => ({ q: t(`${k}_q`), a: t(`${k}_a`) })),
    [t],
  );
  const dateLocale = lang === "pt" ? "pt-PT" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : "en-US";
  const pkgMeta = (id) => {
    const keys = BILLING_PKG_KEYS[id] || BILLING_PKG_KEYS.starter;
    return {
      name: id.charAt(0).toUpperCase() + id.slice(1),
      icon: PKG_ICONS[id] || Sparkles,
      tag: t(keys.tag),
      blurb: t(keys.blurb),
      bullets: keys.bullets.map((k) => t(k)),
    };
  };
  useTitle(t("sidebar_billing"));
  const { user, addCredits, getLocalTransactions } = useAuth();
  const { region, symbol, label, checkoutNote, refresh: refreshPricing } = usePricing();
  const [params, setParams] = useSearchParams();
  const [pkgs, setPkgs] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const pricingMeta = useMemo(() => getPricingMeta(), []);
  const minCustomCredits = pricingMeta.minCustomCredits || 150;
  const [customCredits, setCustomCredits] = useState(minCustomCredits);

  useEffect(() => {
    setCustomCredits((n) => Math.max(minCustomCredits, n));
  }, [minCustomCredits]);

  const customQuote = useMemo(() => {
    const q = customPurchasePrice(customCredits);
    const unitLabel = symbol || (region === "usd" ? "$" : "€");
    return { ...q, unitLabel };
  }, [customCredits, region, symbol]);

  useEffect(() => {
    api.get("/public/packages")
      .then((r) => {
        if (r.data.packages?.length) setPkgs(r.data.packages);
        else setPkgs(FALLBACK_PACKAGES);
        if (r.data.region) setStoredPricingRegion(r.data.region);
      })
      .catch(() => setPkgs(FALLBACK_PACKAGES));
    api.get("/credits/transactions?limit=40")
      .then((r) => setTxs(r.data.transactions || []))
      .catch(() => setTxs(getLocalTransactions?.() || []))
      .finally(() => setLoadingTx(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sessionId = params.get("session_id");
    const status = params.get("checkout");
    if (status === "cancel") {
      toast.info(t("bill_cancelled"));
      setParams({});
      return;
    }
    if (!sessionId || status !== "success") return;
    const claimedKey = `rp_stripe_claimed_${sessionId}`;
    if (localStorage.getItem(claimedKey)) {
      setParams({});
      return;
    }
    api.get(`/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => {
        if (!r.data?.paid || !r.data?.credits) throw new Error(t("bill_payment_pending"));
        addCredits(r.data.credits, t("bill_purchase_desc", { pkg: r.data.package || "" }).trim());
        emitNotification({
          type: "credits_purchase",
          titleKey: "notif_purchase_title",
          bodyKey: "notif_purchase_body",
          credits: r.data.credits,
          balance: r.data.new_balance,
          href: "/app/billing",
        });
        if (r.data.pricing_region) setStoredPricingRegion(r.data.pricing_region, { lock: true });
        void refreshPricing();
        localStorage.setItem(claimedKey, "1");
        setTxs(getLocalTransactions?.() || []);
        toast.success(t("bill_credits_added", { n: r.data.credits }));
      })
      .catch((err) => toast.error(err?.response?.data?.detail || err?.message || t("bill_confirm_fail")))
      .finally(() => setParams({}));
  }, [params, setParams, addCredits, getLocalTransactions, refreshPricing, t]);

  const buy = async (pkgId) => {
    setCheckoutLoading(pkgId);
    try {
      const { data } = await api.post("/stripe/checkout", { package: pkgId, origin: resolveCanonicalOrigin() });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("bill_checkout_fail"));
      setCheckoutLoading(null);
    }
  };

  const buyCustom = async () => {
    if (customQuote.credits < minCustomCredits) {
      toast.error(t("bill_custom_invalid", { n: minCustomCredits }));
      return;
    }
    setCheckoutLoading("custom");
    try {
      const { data } = await api.post("/stripe/checkout", {
        custom_credits: customQuote.credits,
        origin: resolveCanonicalOrigin(),
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("bill_checkout_fail"));
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid="billing-page">
      {/* === Header === */}
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("bill_credits_eyebrow")}</p>
        <h1 className="text-rp-text font-semibold leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-4">
          {t("bill_title")}
        </h1>
        <p className="text-rp-mute text-[15px] max-w-[640px]">
          {t("bill_subtitle")}
        </p>
      </header>

      {checkoutNote && (
        <p className="text-[#C4B5FD] text-[13px] mb-6 max-w-[640px] border border-[#7C3AED]/30 rounded-xl px-4 py-3 bg-[#7C3AED]/10">
          {checkoutNote}
          {label ? ` · ${label}` : ""}
          {region === "usd" ? " (Brasil ou Angola)" : ""}
        </p>
      )}

      {/* === Current balance pill === */}
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-rp-purple/35 bg-gradient-to-r from-rp-purple/15 to-rp-neonCyan/5 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(124,58,237,0.35)] mb-10" data-testid="current-balance">
        <Coins className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#C4B5FD]">{t("bill_balance_label")}</p>
          <p className="text-rp-text text-[22px] font-light leading-none">
            {user?.is_unlimited
              ? t("bill_credits_unlimited")
              : t("bill_credits_count", { n: user?.credits ?? 0 })}
          </p>
        </div>
      </div>

      {/* === Pricing grid === */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {pkgs.map((p) => {
            const meta = pkgMeta(p.id);
            const isPopular = p.id === "creator";
            const isPromo = p.id === "starter";
            const isStudio = p.id === "studio";
            const isPro = p.id === "pro";
            const bonusPct = Number(p.bonus_percent) || 0;
            const Icon = meta.icon;
            const amount = p.amount_display ?? p.amount_eur ?? (p.amount_cents / 100);
            const perUnit = (p.credits / amount).toFixed(1);
            const unitLabel = (p.currency || "eur") === "usd" ? "$" : "€";
            return (
              <div key={p.id} data-testid={`billing-pkg-${p.id}`}
                className={`relative rounded-2xl border p-7 backdrop-blur-xl transition-all duration-300 flex flex-col hover:-translate-y-1
                  ${isPopular
                    ? "border-rp-purple bg-gradient-to-br from-[#1B0D3A] via-rp-surface to-rp-bg shadow-[0_0_60px_-20px_rgba(124,58,237,0.55)] md:scale-[1.03]"
                    : isStudio || isPro
                      ? "border-rp-purple/35 bg-gradient-to-br from-rp-surface to-rp-bg hover:border-rp-purple/50"
                      : "border-rp-border bg-rp-surface/90 hover:border-rp-mute2 hover:shadow-[0_20px_50px_-28px_rgba(124,58,237,0.2)]"}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[10px] font-mono uppercase tracking-[0.16em] shadow-lg shadow-[#7C3AED]/40">
                    <TrendingUp className="w-3 h-3" /> {t("bill_most_popular")}
                  </div>
                )}
                {isPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#C4B5FD] to-[#EC4899] text-black text-[10px] font-mono uppercase tracking-[0.16em] shadow-lg shadow-[#7C3AED]/30">
                    {t("bill_promo_launch")}
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-white/5 ${isPopular ? "bg-rp-purple/25 text-rp-lavender shadow-[0_0_24px_-8px_rgba(124,58,237,0.5)]" : "bg-rp-surfaceRaised text-rp-lavender"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-rp-text text-[26px] font-semibold tracking-tight mb-1">{meta.name}</h3>
                <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.18em] mb-5">{meta.tag}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-rp-mute text-[16px]">{symbol || unitLabel}</span>
                  <span className="text-rp-text text-[52px] font-light leading-none tracking-tight">{amount}</span>
                </div>
                <p className="text-[#C4B5FD] text-[14px] font-medium mb-1" data-testid={`credits-${p.id}`}>
                  {t("bill_credits_count", { n: p.credits })}
                </p>
                {bonusPct > 0 && (
                  <p className="text-[#7C3AED] text-[11px] font-mono uppercase tracking-[0.12em] mb-1">
                    {t("bill_pkg_bonus", { n: bonusPct })}
                  </p>
                )}
                <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] mb-6">
                  {t("bill_credits_per_unit", { n: perUnit, unit: unitLabel })}
                </p>

                <p className="text-rp-mute text-[13px] leading-relaxed mb-5 min-h-[60px]">{meta.blurb}</p>

                <ul className="space-y-2 mb-7 flex-1">
                  {meta.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-rp-text text-[13px]">
                      <Check className="w-4 h-4 mt-0.5 text-[#7C3AED] shrink-0" strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => buy(p.id)} disabled={!!checkoutLoading} data-testid={`buy-${p.id}`}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[12px] font-mono font-semibold uppercase tracking-[0.16em] transition-all duration-200 disabled:opacity-50
                    ${isPopular
                      ? "bg-gradient-to-r from-rp-purple to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#a855f7] text-white shadow-lg shadow-rp-purple/45 hover:scale-[1.02] hover:brightness-110"
                      : "border border-rp-border hover:border-rp-purple/60 text-rp-text hover:bg-rp-purple/12 hover:shadow-[0_0_28px_-10px_rgba(124,58,237,0.35)]"}`}>
                  {checkoutLoading === p.id ? (
                    t("bill_opening_stripe")
                  ) : (
                    <>{t("bill_buy", { name: meta.name })} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div
          className="mt-8 rounded-2xl border border-rp-purple/35 bg-gradient-to-br from-rp-surface to-rp-bg p-7 md:p-8"
          data-testid="billing-custom-credits"
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7C3AED] mb-2">{t("bill_custom_title")}</p>
          <p className="text-rp-mute text-[14px] max-w-[640px] mb-6">
            {t("bill_custom_subtitle", { rate: pricingMeta.creditsPerEuro || 30 })}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex-1 max-w-[280px]">
              <label htmlFor="custom-credits-input" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-rp-mute2 mb-2">
                {t("bill_custom_amount_label")}
              </label>
              <input
                id="custom-credits-input"
                type="number"
                min={minCustomCredits}
                step={10}
                value={customCredits}
                onChange={(e) => setCustomCredits(e.target.value)}
                onBlur={() => setCustomCredits(Math.max(minCustomCredits, Math.round(Number(customCredits) || minCustomCredits)))}
                className="w-full rounded-xl border border-rp-border bg-rp-bg px-4 py-3 text-rp-text text-[22px] font-light tabular-nums focus:border-rp-purple/60 focus:outline-none"
                data-testid="custom-credits-input"
              />
              <p className="text-rp-mute2 text-[11px] font-mono mt-2 uppercase tracking-[0.12em]">
                {t("bill_custom_min", { n: minCustomCredits })}
              </p>
            </div>
            <div className="flex-1 sm:text-right">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-rp-mute2 mb-1">{t("bill_custom_price")}</p>
              <p className="text-rp-text text-[42px] font-light leading-none tracking-tight">
                <span className="text-rp-mute text-[18px] align-top mr-1">{symbol || customQuote.unitLabel}</span>
                {customQuote.price}
              </p>
              <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em] mt-2">
                {t("bill_credits_per_unit", { n: customQuote.perUnit, unit: customQuote.unitLabel })}
              </p>
            </div>
            <button
              type="button"
              onClick={buyCustom}
              disabled={!!checkoutLoading}
              data-testid="buy-custom-credits"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[12px] font-mono font-semibold uppercase tracking-[0.16em] bg-gradient-to-r from-rp-purple to-[#9333ea] text-white shadow-lg shadow-rp-purple/45 hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {checkoutLoading === "custom" ? (
                t("bill_opening_stripe")
              ) : (
                <>{t("bill_custom_buy", { n: customQuote.credits })} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* === Recent activity === */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-rp-text text-[24px] font-semibold tracking-tight">{t("bill_recent_activity")}</h2>
          <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.14em]">
            {t("bill_tx_count", { n: txs.length })}
          </p>
        </div>
        {loadingTx ? (
          <p className="text-rp-mute text-sm">{t("loading")}</p>
        ) : txs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rp-border p-10 text-center">
            <Receipt className="w-7 h-7 mx-auto mb-3 text-rp-mute2" strokeWidth={1.5} />
            <p className="text-rp-mute text-[14px]">{t("bill_no_tx")}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-rp-border overflow-hidden" data-testid="transactions-table">
            {txs.map((tx, i) => {
              const isCredit = tx.amount > 0;
              const Icon = tx.type === "refund" ? RefreshCw : isCredit ? Plus : Minus;
              return (
                <div key={tx.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-rp-surfaceRaised transition-colors ${i < txs.length - 1 ? "border-b border-rp-border" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-[#7C3AED]/15 text-[#C4B5FD]" : "bg-[#2E2E30] text-rp-mute"}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-rp-text text-[14px] truncate">{tx.description || tx.type}</p>
                    <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.12em] mt-0.5">
                      {new Date(tx.created_at).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <span className={`font-mono text-[15px] tabular-nums shrink-0 ${isCredit ? "text-[#C4B5FD]" : "text-rp-mute"}`}>
                    {isCredit ? "+" : ""}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === Termos resumidos === */}
      <section className="mb-16 rounded-2xl border border-rp-border bg-rp-surface/80 p-6 md:p-8" data-testid="billing-terms">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("bill_terms_eyebrow")}</p>
        <h2 className="text-rp-text text-[20px] font-semibold tracking-tight mb-4">{t("bill_terms_title")}</h2>
        <ul className="space-y-3 text-rp-mute text-[14px] leading-relaxed list-disc pl-5">
          <li>{t("bill_terms_1")}</li>
          <li>{t("bill_terms_2")}</li>
          <li>{t("bill_terms_3")}</li>
          <li>{t("bill_terms_4")}</li>
          <li>
            {t("bill_terms_5")}{" "}
            <a href="mailto:suporte@remakepix.com" className="text-[#C4B5FD] hover:underline">suporte@remakepix.com</a>
          </li>
        </ul>
        <p className="text-rp-mute2 text-[12px] mt-5 font-mono uppercase tracking-[0.1em]">
          {t("bill_terms_confirm")}
        </p>
      </section>

      {/* === FAQ === */}
      <section>
        <div className="flex items-center gap-2 mb-5 text-[#7C3AED]">
          <HelpCircle className="w-4 h-4" />
          <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD]">{t("bill_faq_title")}</h2>
          <div className="flex-1 h-px bg-[#2E2E30]" />
        </div>
        <div className="space-y-2.5">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <button key={i} onClick={() => setOpenFaq(open ? null : i)}
                className={`w-full text-left rounded-xl border transition-all p-5 ${open ? "border-[#7C3AED]/40 bg-[#7C3AED]/5" : "border-rp-border bg-rp-surface hover:border-[#5A5A5E]"}`}
                data-testid={`faq-${i}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-rp-text text-[15px] font-medium">{f.q}</p>
                  <span className={`text-[#C4B5FD] text-[20px] leading-none transition-transform ${open ? "rotate-45" : ""}`}>+</span>
                </div>
                {open && <p className="text-rp-mute text-[13px] leading-relaxed mt-3">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
