import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { Coins, Mail, Globe, ShieldCheck, Calendar, User as UserIcon, ArrowUpRight, Pencil } from "lucide-react";

/** Premium SaaS profile page — Remake Pixel identity (deep #0B0B0C + #7C3AED).
 *  Hero card with avatar + name + role badge + edit button, then 4 grid tiles
 *  for the user facts, with the credit balance escalated into a hero card.
 */
export default function Profile() {
  const { t } = useI18n();
  useTitle(t("sidebar_profile"));
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const roleLabel = user.role === "admin" ? "Administrador" : "Membro";

  return (
    <div className="max-w-[960px] mx-auto pb-20" data-testid="profile-page">
      {/* === Header === */}
      <header className="mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">Conta</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px]">
          O <span className="italic text-[#C4B5FD]">teu</span> perfil.
        </h1>
      </header>

      {/* === Hero card === */}
      <section className="relative overflow-hidden rounded-2xl border border-[#2E2E30] bg-gradient-to-br from-[#13131A] via-[#0B0B0C] to-[#0B0B0C] p-8 md:p-10 mb-8" data-testid="profile-hero">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-[#9333EA]/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center text-white text-[40px] md:text-[44px] font-light shadow-lg shadow-[#7C3AED]/40">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-[#F4F1EA] text-[28px] md:text-[34px] font-light leading-tight tracking-tight truncate" data-testid="profile-name">
                {user.name || user.email.split("@")[0]}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#C4B5FD]" data-testid="profile-role">
                  {roleLabel}
                </span>
                <span className="text-[#8A8A8E] text-[12px] truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
            <Link to="/app/settings" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#2E2E30] hover:border-[#7C3AED] text-[#F4F1EA] text-[12px] font-mono uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5" data-testid="profile-edit-btn">
              <Pencil className="w-3.5 h-3.5" /> Editar Perfil
            </Link>
            <button onClick={() => navigate("/app/billing")} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white text-[12px] font-mono uppercase tracking-[0.15em] shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 transition-all hover:-translate-y-0.5" data-testid="profile-billing-btn">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ver Planos
            </button>
          </div>
        </div>
      </section>

      {/* === Credits hero === */}
      <section className="relative overflow-hidden rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#1B0D3A] via-[#13131A] to-[#0B0B0C] p-8 md:p-10 mb-8" data-testid="profile-credits-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.20),transparent_60%)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
              <Coins className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD] mb-1">Saldo de Créditos</p>
              <p className="text-[#F4F1EA] text-[48px] md:text-[64px] font-light leading-none tracking-tight" data-testid="profile-balance">
                {user.credits}
              </p>
            </div>
          </div>
          <Link to="/app/billing" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white text-[12px] font-mono uppercase tracking-[0.15em] shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 transition-all hover:-translate-y-0.5 self-start md:self-auto" data-testid="profile-buy-credits">
            Comprar Créditos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* === Info grid === */}
      <section>
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">Detalhes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#2E2E30] rounded-xl overflow-hidden border border-[#2E2E30]">
          <InfoTile icon={<UserIcon className="w-4 h-4" />}     label="Nome"          value={user.name || "Sem nome"} testId="info-name" />
          <InfoTile icon={<Mail className="w-4 h-4" />}         label="Email"         value={user.email} testId="info-email" />
          <InfoTile icon={<ShieldCheck className="w-4 h-4" />}  label="Papel"         value={roleLabel} testId="info-role" />
          <InfoTile icon={<Globe className="w-4 h-4" />}        label="Idioma"        value={(user.lang || "pt").toUpperCase()} testId="info-lang" />
          <InfoTile icon={<Calendar className="w-4 h-4" />}     label="Membro Desde"  value={joined} testId="info-joined" wide />
        </div>
      </section>
    </div>
  );
}

function InfoTile({ icon, label, value, testId, wide }) {
  return (
    <div className={`relative bg-[#0F0F12] hover:bg-[#13131A] px-6 py-5 transition-colors ${wide ? "sm:col-span-2" : ""}`} data-testid={testId}>
      <div className="flex items-center gap-2 mb-2 text-[#7C3AED]">
        {icon}
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#8A8A8E]">{label}</p>
      </div>
      <p className="text-[#F4F1EA] text-[17px] font-light tracking-tight truncate">{value}</p>
    </div>
  );
}
