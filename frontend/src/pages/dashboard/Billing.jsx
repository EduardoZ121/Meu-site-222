import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const PKG_NAMES = { starter: "Starter", creator: "Creator", studio: "Studio" };

export default function Billing() {
  const { t } = useI18n();
  useTitle(t("sidebar_billing"));
  const [pkgs, setPkgs] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    api.get("/public/packages").then((r) => setPkgs(r.data.packages || [])).catch(() => {});
    api.get("/credits/transactions?limit=40").then((r) => setTxs(r.data.transactions || [])).finally(() => setLoadingTx(false));
  }, []);

  const buy = async (pkgId) => {
    setCheckoutLoading(pkgId);
    try {
      const { data } = await api.post("/stripe/checkout", { package: pkgId });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("bill_checkout_failed"));
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto" data-testid="billing-page">
      <div className="mb-10">
        <p className="eyebrow mb-3">{t("bill_eyebrow")}</p>
        <h1 className="heading-xl">{t("bill_title")}</h1>
      </div>

      <section className="mb-16">
        <h2 className="font-heading text-2xl text-rp-text mb-6">{t("bill_buy")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rp-border">
          {pkgs.map((p) => (
            <div key={p.id} className="bg-rp-bg p-8" data-testid={`billing-pkg-${p.id}`}>
              <h3 className="font-heading text-2xl text-rp-text mb-1">{PKG_NAMES[p.id] || p.name}</h3>
              <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.18em] mb-6">{p.tagline}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-rp-mute text-sm">€</span>
                <span className="font-heading text-5xl text-rp-text">{p.amount_eur}</span>
              </div>
              <p className="text-rp-mute text-[12px] font-mono uppercase tracking-[0.14em] mb-8">{p.credits} {t("credits")}</p>
              <button onClick={() => buy(p.id)} disabled={!!checkoutLoading} className="btn-primary w-full disabled:opacity-50" data-testid={`buy-${p.id}`}>
                {checkoutLoading === p.id ? t("bill_opening") : t("bill_buy_btn", { name: PKG_NAMES[p.id] || p.name })}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl text-rp-text mb-6">{t("bill_recent")}</h2>
        {loadingTx ? (
          <p className="text-rp-mute text-sm">{t("loading")}</p>
        ) : txs.length === 0 ? (
          <p className="text-rp-mute text-sm">{t("bill_no_tx")}</p>
        ) : (
          <div className="border border-rp-border" data-testid="transactions-table">
            {txs.map((tx, i) => (
              <div key={tx.id} className={`flex items-center justify-between px-6 py-4 ${i < txs.length - 1 ? "border-b border-rp-border" : ""}`}>
                <div>
                  <p className="text-rp-text text-sm">{tx.description || tx.type}</p>
                  <p className="text-rp-mute2 text-[10px] font-mono uppercase tracking-[0.14em] mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-mono text-sm ${tx.amount > 0 ? "text-rp-lavender" : "text-rp-mute"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
