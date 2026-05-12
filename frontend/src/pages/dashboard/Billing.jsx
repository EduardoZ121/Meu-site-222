import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const labels = {
  starter: "Starter",
  creator: "Creator",
  studio: "Studio",
};

export default function Billing() {
  useTitle("Billing");
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
      toast.error(err?.response?.data?.detail || "Checkout failed");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto" data-testid="billing-page">
      <div className="mb-10">
        <p className="eyebrow mb-3">Billing</p>
        <h1 className="heading-xl">Credits & purchases.</h1>
      </div>

      <section className="mb-16">
        <h2 className="font-heading text-2xl text-rp-text mb-6">Buy credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rp-border">
          {pkgs.map((p) => (
            <div key={p.id} className="bg-rp-bg p-8" data-testid={`billing-pkg-${p.id}`}>
              <h3 className="font-heading text-2xl text-rp-text mb-1">{labels[p.id] || p.name}</h3>
              <p className="text-rp-mute2 text-[11px] font-mono uppercase tracking-[0.18em] mb-6">{p.tagline}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-rp-mute text-sm">€</span>
                <span className="font-heading text-5xl text-rp-text">{p.amount_eur}</span>
              </div>
              <p className="text-rp-mute text-[12px] font-mono uppercase tracking-[0.14em] mb-8">{p.credits} credits</p>
              <button onClick={() => buy(p.id)} disabled={!!checkoutLoading} className="btn-primary w-full disabled:opacity-50" data-testid={`buy-${p.id}`}>
                {checkoutLoading === p.id ? "Opening…" : `Buy ${labels[p.id] || p.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl text-rp-text mb-6">Recent activity</h2>
        {loadingTx ? (
          <p className="text-rp-mute text-sm">Loading…</p>
        ) : txs.length === 0 ? (
          <p className="text-rp-mute text-sm">No transactions yet.</p>
        ) : (
          <div className="border border-rp-border" data-testid="transactions-table">
            {txs.map((t, i) => (
              <div key={t.id} className={`flex items-center justify-between px-6 py-4 ${i < txs.length - 1 ? "border-b border-rp-border" : ""}`}>
                <div>
                  <p className="text-rp-text text-sm">{t.description || t.type}</p>
                  <p className="text-rp-mute2 text-[10px] font-mono uppercase tracking-[0.14em] mt-1">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-mono text-sm ${t.amount > 0 ? "text-rp-lavender" : "text-rp-mute"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
