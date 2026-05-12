import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

export default function Admin() {
  const { t } = useI18n();
  useTitle(t("sidebar_admin"));
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(null);

  const reload = () => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get(`/admin/users?limit=80${search ? `&search=${encodeURIComponent(search)}` : ""}`).then((r) => setUsers(r.data.users || [])).catch(() => {});
    api.get("/admin/transactions?limit=40").then((r) => setTxs(r.data.transactions || [])).catch(() => {});
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const adjustCredits = async (uid, amount, reason) => {
    try {
      await api.post("/admin/credits/adjust", { user_id: uid, amount, reason });
      toast.success(t("adm_credits_adjusted"));
      reload();
    } catch { toast.error(t("failed")); }
  };

  const patchUser = async (uid, patch) => {
    try {
      await api.patch(`/admin/users/${uid}`, patch);
      toast.success(t("adm_updated"));
      reload();
    } catch { toast.error(t("failed")); }
  };

  return (
    <div className="max-w-[1300px] mx-auto" data-testid="admin-page">
      <p className="eyebrow mb-3">{t("adm_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("adm_title")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-rp-border mb-12" data-testid="admin-stats">
        {stats && (
          <>
            <Stat label={t("adm_users")} value={stats.users} />
            <Stat label={t("adm_creations")} value={stats.creations} />
            <Stat label={t("adm_purchases")} value={stats.purchases} />
            <Stat label={t("adm_revenue")} value={`€${stats.revenue_eur?.toFixed(2)}`} />
            <Stat label={t("adm_circulation")} value={stats.credits_in_circulation} />
          </>
        )}
      </div>

      <section className="mb-14">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-heading text-2xl text-rp-text">{t("adm_users")}</h2>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("adm_search_placeholder")} className="field-input !py-2 !px-3" data-testid="admin-search" />
            <button onClick={reload} className="btn-secondary !py-2 !px-4" data-testid="admin-search-btn">{t("search")}</button>
          </div>
        </div>
        <div className="border border-rp-border overflow-x-auto" data-testid="admin-users-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">{t("adm_role")}</th>
                <th className="text-right p-3">{t("credits")}</th>
                <th className="text-center p-3">{t("adm_banned")}</th>
                <th className="text-right p-3">{t("adm_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-rp-border last:border-b-0 text-rp-text">
                  <td className="p-3"><span className="text-rp-text">{u.email}</span><br/><span className="text-rp-mute2 text-[10px] font-mono">{u.id}</span></td>
                  <td className="p-3"><span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.role === "admin" ? "text-rp-lavender" : "text-rp-mute"}`}>{u.role}</span></td>
                  <td className="p-3 text-right font-mono">{u.credits}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => patchUser(u.id, { banned: !u.banned })} className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.banned ? "text-red-400" : "text-rp-mute"}`} data-testid={`ban-${u.id}`}>{u.banned ? t("adm_yes") : t("adm_no")}</button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setAdjustOpen(adjustOpen === u.id ? null : u.id)} className="btn-ghost" data-testid={`adjust-${u.id}`}>{t("adm_adjust")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adjustOpen && (
          <AdjustCreditsForm userId={adjustOpen} t={t} onCancel={() => setAdjustOpen(null)} onConfirm={(amt, reason) => { adjustCredits(adjustOpen, amt, reason); setAdjustOpen(null); }} />
        )}
      </section>

      <section>
        <h2 className="font-heading text-2xl text-rp-text mb-6">{t("adm_recent_tx")}</h2>
        <div className="border border-rp-border" data-testid="admin-txs">
          {txs.map((tx, i) => (
            <div key={tx.id} className={`flex items-center justify-between px-4 py-3 ${i < txs.length - 1 ? "border-b border-rp-border" : ""}`}>
              <div>
                <p className="text-rp-text text-sm">{tx.description || tx.type}</p>
                <p className="text-rp-mute2 text-[10px] font-mono">{tx.user_id} · {new Date(tx.created_at).toLocaleString()}</p>
              </div>
              <span className={`font-mono text-sm ${tx.amount > 0 ? "text-rp-lavender" : "text-rp-mute"}`}>{tx.amount > 0 ? "+" : ""}{tx.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-rp-bg p-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">{label}</p>
      <p className="font-heading text-3xl text-rp-text">{value}</p>
    </div>
  );
}

function AdjustCreditsForm({ userId, t, onCancel, onConfirm }) {
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState("admin grant");
  return (
    <div className="border border-rp-purple mt-3 p-5 bg-rp-surface" data-testid="adjust-form">
      <p className="eyebrow mb-3">{t("adm_adjust_title")} {userId.slice(0, 8)}…</p>
      <div className="flex gap-3 flex-wrap">
        <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0"))} className="field-input w-32 !py-2" data-testid="adjust-amount" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="field-input flex-1 !py-2 min-w-[200px]" data-testid="adjust-reason" />
        <button onClick={() => onConfirm(amount, reason)} className="btn-primary !py-2 !px-5" data-testid="adjust-confirm">{t("apply")}</button>
        <button onClick={onCancel} className="btn-secondary !py-2 !px-5" data-testid="adjust-cancel">{t("cancel")}</button>
      </div>
    </div>
  );
}
