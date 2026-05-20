import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import {
  Sparkles, Zap, Rocket, Check, ArrowRight, Coins, Receipt, RefreshCw,
  TrendingUp, Plus, Minus, HelpCircle,
} from "lucide-react";

const PKG_META = {
  starter: { name: "Starter",  icon: Sparkles, tag: "Para experimentar",        blurb: "Perfeito para um fim-de-semana de experimentação. Suficiente para 12 gerações HD.", bullets: ["Geração de imagem", "Estilos artísticos", "Suporte por email"] },
  creator: { name: "Creator",  icon: Zap,      tag: "Para criadores activos",   blurb: "O nosso plano mais popular. Mês inteiro de saídas consistentes com IA premium.", bullets: ["Tudo do Starter", "Vídeo IA (6s)", "Pôsteres + Carrossel IG", "Acesso prioritário"] },
  studio:  { name: "Studio",   icon: Rocket,   tag: "Workflows pro, sem limites", blurb: "Estúdios e agências. Pacote pro para quem cria diariamente para clientes.", bullets: ["Tudo do Creator", "Estilos Premium", "Fila de geração prioritária", "Sem marca de água"] },
};

const FAQS = [
  {
    q: "O que são créditos?",
    a: "Cada geração de imagem ou vídeo consome créditos: a tabela está em cada ferramenta (ex.: 10 cr para imagem rápida, 20 cr para vídeo). Compras um pack uma vez e usas quando quiseres — sem subscrição obrigatória.",
  },
  {
    q: "Os créditos expiram?",
    a: "Não. Os créditos comprados ficam contigo até os usares.",
  },
  {
    q: "Posso pedir reembolso?",
    a: "Sim. Se uma geração falhar (timeout, erro do servidor) os créditos são automaticamente devolvidos. Para outros casos, fala connosco em suporte@remakepixel.com.",
  },
  {
    q: "Aceitam que método de pagamento?",
    a: "Pagamentos seguros via Stripe: cartão de crédito/débito (Visa, Mastercard, Amex), Apple Pay e Google Pay.",
  },
];

export default function Billing() {
  const { t } = useI18n();
  useTitle(t("sidebar_billing"));
  const { user } = useAuth();
  const [pkgs, setPkgs] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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
      toast.error(err?.response?.data?.detail || "Falhou a abrir o checkout.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid="billing-page">
      {/* === Header === */}
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">Créditos</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-4">
          Combustível para a tua <span className="italic text-[#C4B5FD]">criatividade</span>.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">
          Compra créditos uma vez e usa-os quando quiseres — sem subscrição obrigatória, sem datas de expiração.
        </p>
      </header>

      {/* === Current balance pill === */}
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 mb-10" data-testid="current-balance">
        <Coins className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#C4B5FD]">Saldo Actual</p>
          <p className="text-[#F4F1EA] text-[22px] font-light leading-none">{user?.credits ?? 0} créditos</p>
        </div>
      </div>

      {/* === Pricing grid === */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pkgs.map((p) => {
            const meta = PKG_META[p.id] || PKG_META.starter;
            const isPopular = p.id === "creator";
            const isStudio = p.id === "studio";
            const Icon = meta.icon;
            const perEuro = (p.credits / p.amount_eur).toFixed(1);
            return (
              <div key={p.id} data-testid={`billing-pkg-${p.id}`}
                className={`relative rounded-2xl border p-7 transition-all flex flex-col
                  ${isPopular
                    ? "border-[#7C3AED] bg-gradient-to-br from-[#1B0D3A] via-[#13131A] to-[#0B0B0C] shadow-[0_0_60px_-20px_rgba(124,58,237,0.5)] md:scale-[1.03]"
                    : isStudio
                      ? "border-[#7C3AED]/30 bg-gradient-to-br from-[#13131A] to-[#0B0B0C]"
                      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[10px] font-mono uppercase tracking-[0.16em] shadow-lg shadow-[#7C3AED]/40">
                    <TrendingUp className="w-3 h-3" /> Mais Popular
                  </div>
                )}

                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${isPopular ? "bg-[#7C3AED]/20 text-[#C4B5FD]" : "bg-[#2E2E30] text-[#C4B5FD]"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-[#F4F1EA] text-[26px] font-light tracking-tight mb-1">{meta.name}</h3>
                <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.18em] mb-5">{meta.tag}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[#8A8A8E] text-[16px]">€</span>
                  <span className="text-[#F4F1EA] text-[52px] font-light leading-none tracking-tight">{p.amount_eur}</span>
                </div>
                <p className="text-[#C4B5FD] text-[14px] font-medium mb-1" data-testid={`credits-${p.id}`}>{p.credits} créditos</p>
                <p className="text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.14em] mb-6">{perEuro} cr / €</p>

                <p className="text-[#8A8A8E] text-[13px] leading-relaxed mb-5 min-h-[60px]">{meta.blurb}</p>

                <ul className="space-y-2 mb-7 flex-1">
                  {meta.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[#F4F1EA] text-[13px]">
                      <Check className="w-4 h-4 mt-0.5 text-[#7C3AED] shrink-0" strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => buy(p.id)} disabled={!!checkoutLoading} data-testid={`buy-${p.id}`}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg text-[12px] font-mono uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 disabled:opacity-50
                    ${isPopular
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white shadow-lg shadow-[#7C3AED]/40 hover:shadow-[#7C3AED]/60"
                      : "border border-[#2E2E30] hover:border-[#7C3AED] text-[#F4F1EA] hover:bg-[#7C3AED]/10"}`}>
                  {checkoutLoading === p.id ? "A abrir Stripe…" : (<>Comprar {meta.name} <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* === Recent activity === */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-[#F4F1EA] text-[24px] font-light tracking-tight">Atividade Recente</h2>
          <p className="text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.14em]">{txs.length} transações</p>
        </div>
        {loadingTx ? (
          <p className="text-[#8A8A8E] text-sm">A carregar…</p>
        ) : txs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2E2E30] p-10 text-center">
            <Receipt className="w-7 h-7 mx-auto mb-3 text-[#5A5A5E]" strokeWidth={1.5} />
            <p className="text-[#8A8A8E] text-[14px]">Ainda não tens transações. A primeira compra fica registada aqui.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#2E2E30] overflow-hidden" data-testid="transactions-table">
            {txs.map((tx, i) => {
              const isCredit = tx.amount > 0;
              const Icon = tx.type === "refund" ? RefreshCw : isCredit ? Plus : Minus;
              return (
                <div key={tx.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-[#13131A] transition-colors ${i < txs.length - 1 ? "border-b border-[#2E2E30]" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-[#7C3AED]/15 text-[#C4B5FD]" : "bg-[#2E2E30] text-[#8A8A8E]"}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F4F1EA] text-[14px] truncate">{tx.description || tx.type}</p>
                    <p className="text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.12em] mt-0.5">
                      {new Date(tx.created_at).toLocaleString("pt-PT")}
                    </p>
                  </div>
                  <span className={`font-mono text-[15px] tabular-nums shrink-0 ${isCredit ? "text-[#C4B5FD]" : "text-[#8A8A8E]"}`}>
                    {isCredit ? "+" : ""}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === FAQ === */}
      <section>
        <div className="flex items-center gap-2 mb-5 text-[#7C3AED]">
          <HelpCircle className="w-4 h-4" />
          <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD]">Perguntas Frequentes</h2>
          <div className="flex-1 h-px bg-[#2E2E30]" />
        </div>
        <div className="space-y-2.5">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <button key={i} onClick={() => setOpenFaq(open ? null : i)}
                className={`w-full text-left rounded-xl border transition-all p-5 ${open ? "border-[#7C3AED]/40 bg-[#7C3AED]/5" : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"}`}
                data-testid={`faq-${i}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[#F4F1EA] text-[15px] font-medium">{f.q}</p>
                  <span className={`text-[#C4B5FD] text-[20px] leading-none transition-transform ${open ? "rotate-45" : ""}`}>+</span>
                </div>
                {open && <p className="text-[#8A8A8E] text-[13px] leading-relaxed mt-3">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
