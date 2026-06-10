import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const TABS = ["overview", "finance", "users", "ip", "purchases", "tx"];

export default function Admin() {
  const { t } = useI18n();
  useTitle(t("sidebar_admin"));
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [ipGroups, setIpGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);

  const markDbMissing = (err) => {
    const s = err?.response?.status;
    if (s === 503) setDbError(true);
  };

  const reload = () => {
    setDbError(false);
    setLoading(true);
    api.get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch((e) => {
        markDbMissing(e);
        setStats(null);
      });
    api.get(`/admin/users?limit=80${search ? `&search=${encodeURIComponent(search)}` : ""}`)
      .then((r) => setUsers(r.data.users || []))
      .catch(() => {});
    api.get("/admin/transactions?limit=40")
      .then((r) => setTxs(r.data.transactions || []))
      .catch(() => {});
    api.get("/admin/purchases?limit=30")
      .then((r) => setPurchases(r.data.purchases || []))
      .catch(() => {});
    api.get("/admin/ip-groups")
      .then((r) => setIpGroups(r.data.groups || []))
      .catch(() => {});
    api.get("/admin/finance")
      .then((r) => setFinance(r.data))
      .catch((e) => {
        markDbMissing(e);
        setFinance(null);
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);

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
      <h1 className="heading-xl mb-6">{t("adm_title")}</h1>

      {dbError && (
        <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 text-sm p-5 mb-8 rounded space-y-3" data-testid="admin-db-warning">
          <p className="font-medium text-amber-50">{t("adm_db_missing_title")}</p>
          <p>{t("adm_db_missing")}</p>
          <ul className="list-disc pl-5 text-amber-100/90 space-y-1 text-xs font-mono">
            <li>MONGO_URL</li>
            <li>DB_NAME</li>
          </ul>
          <p className="text-xs text-amber-200/80">{t("adm_db_missing_hint")}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-10 border-b border-rp-border pb-4">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`text-[10px] font-mono uppercase tracking-[0.18em] px-4 py-2 border transition-colors ${
              tab === id
                ? "border-rp-purple text-rp-lavender bg-rp-surface"
                : "border-rp-border text-rp-mute hover:text-rp-text"
            }`}
            data-testid={`admin-tab-${id}`}
          >
            {t(`adm_tab_${id}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && loading && !stats && (
        <p className="text-rp-mute text-sm mb-8">{t("adm_loading")}</p>
      )}

      {tab === "overview" && !loading && !stats && !dbError && (
        <p className="text-rp-mute text-sm mb-8">{t("adm_stats_empty")}</p>
      )}

      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-rp-border mb-12" data-testid="admin-stats">
          <Stat label={t("adm_users")} value={stats.users} />
          <Stat label={t("adm_signups_week")} value={stats.signups_week} />
          <Stat label={t("adm_signups_today")} value={stats.signups_today} />
          <Stat label={t("adm_creations")} value={stats.creations} />
          <Stat label={t("adm_purchases")} value={stats.purchases} />
          <Stat label={t("adm_revenue")} value={`€${Number(stats.revenue_eur || 0).toFixed(2)}`} />
          <Stat label={t("adm_revenue_usd")} value={`$${Number(stats.revenue_usd || 0).toFixed(2)}`} />
          <Stat label={t("adm_circulation")} value={stats.credits_in_circulation} />
          <Stat label={t("adm_risky_ips")} value={stats.risky_ips} highlight={stats.risky_ips > 0} />
        </div>
      )}

      {tab === "finance" && (
        <FinancePanel finance={finance} t={t} onSaved={() => { reload(); toast.success(t("adm_fin_saved")); }} />
      )}

      {tab === "users" && (
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="font-heading text-2xl text-rp-text">{t("adm_users")}</h2>
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("adm_search_placeholder")} className="field-input !py-2 !px-3" data-testid="admin-search" />
              <button type="button" onClick={reload} className="btn-secondary !py-2 !px-4" data-testid="admin-search-btn">{t("search")}</button>
            </div>
          </div>
          <UsersTable users={users} t={t} adjustOpen={adjustOpen} setAdjustOpen={setAdjustOpen} patchUser={patchUser} adjustCredits={adjustCredits} />
        </section>
      )}

      {tab === "ip" && (
        <section data-testid="admin-ip-groups">
          <h2 className="font-heading text-2xl text-rp-text mb-2">{t("adm_tab_ip")}</h2>
          <p className="text-rp-mute text-sm mb-6">{t("adm_ip_hint")}</p>
          {ipGroups.length === 0 ? (
            <p className="text-rp-mute2 text-sm">{t("adm_ip_empty")}</p>
          ) : (
            <div className="space-y-3">
              {ipGroups.map((g) => (
                <div
                  key={g.ip}
                  className={`border p-4 ${g.count >= 2 ? "border-red-500/50 bg-red-500/5" : "border-emerald-500/40 bg-emerald-500/5"}`}
                  data-testid={`ip-group-${g.ip}`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <span className="font-mono text-sm text-rp-text">{g.ip}</span>
                    <span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${g.count >= 2 ? "text-red-400" : "text-emerald-400"}`}>
                      {g.count >= 2 ? t("adm_ip_risk_high") : t("adm_ip_risk_low")} · {g.count} {t("adm_accounts")}
                    </span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {g.users.map((u) => (
                      <li key={u.id} className="flex justify-between gap-2 text-rp-mute border-t border-rp-border/50 pt-1 first:border-0 first:pt-0">
                        <span>{u.email}</span>
                        <span className="font-mono text-rp-mute2">{u.credits} cr · {u.banned ? t("adm_yes") : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "purchases" && (
        <section data-testid="admin-purchases">
          <h2 className="font-heading text-2xl text-rp-text mb-6">{t("adm_purchases")}</h2>
          <div className="border border-rp-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
                  <th className="text-left p-3">{t("adm_pkg")}</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-right p-3">{t("credits")}</th>
                  <th className="text-right p-3">{t("adm_amount")}</th>
                  <th className="text-left p-3">{t("adm_status")}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id || p.stripe_session_id} className="border-b border-rp-border text-rp-text">
                    <td className="p-3 font-mono text-xs">{p.package}</td>
                    <td className="p-3 text-xs text-rp-mute">{p.user_id}</td>
                    <td className="p-3 text-right font-mono">{p.credits}</td>
                    <td className="p-3 text-right font-mono">
                      {p.amount_eur != null ? `€${p.amount_eur}` : p.amount_usd != null ? `$${p.amount_usd}` : "—"}
                    </td>
                    <td className="p-3 text-[10px] uppercase font-mono text-rp-mute">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "tx" && (
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
      )}
    </div>
  );
}

function UsersTable({ users, t, adjustOpen, setAdjustOpen, patchUser, adjustCredits }) {
  return (
    <>
      <div className="border border-rp-border overflow-x-auto" data-testid="admin-users-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">IP</th>
              <th className="text-left p-3">{t("adm_role")}</th>
              <th className="text-right p-3">{t("credits")}</th>
              <th className="text-center p-3">{t("adm_banned")}</th>
              <th className="text-right p-3">{t("adm_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-rp-border last:border-b-0 text-rp-text">
                <td className="p-3">
                  <span className="text-rp-text">{u.email}</span>
                  <br />
                  <span className="text-rp-mute2 text-[10px] font-mono">{u.id}</span>
                </td>
                <td className="p-3 font-mono text-[10px] text-rp-mute">{u.signup_ip || u.last_ip || "—"}</td>
                <td className="p-3">
                  <span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.role === "admin" ? "text-rp-lavender" : "text-rp-mute"}`}>{u.role}</span>
                </td>
                <td className="p-3 text-right font-mono">{u.credits}</td>
                <td className="p-3 text-center">
                  <button type="button" onClick={() => patchUser(u.id, { banned: !u.banned })} className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.banned ? "text-red-400" : "text-rp-mute"}`} data-testid={`ban-${u.id}`}>
                    {u.banned ? t("adm_yes") : t("adm_no")}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => setAdjustOpen(adjustOpen === u.id ? null : u.id)} className="btn-ghost" data-testid={`adjust-${u.id}`}>{t("adm_adjust")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adjustOpen && (
        <AdjustCreditsForm userId={adjustOpen} t={t} onCancel={() => setAdjustOpen(null)} onConfirm={(amt, reason) => { adjustCredits(adjustOpen, amt, reason); setAdjustOpen(null); }} />
      )}
    </>
  );
}

function FinancePanel({ finance, t, onSaved }) {
  const [balanceInput, setBalanceInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (finance?.settings?.replicate_balance_usd != null) {
      setBalanceInput(String(finance.settings.replicate_balance_usd));
    }
  }, [finance?.settings?.replicate_balance_usd]);

  if (!finance) {
    return (
      <p className="text-rp-mute text-sm">
        {t("adm_fin_loading")}
        <span className="block mt-2 text-rp-mute2 text-xs">{t("adm_fin_need_db")}</span>
      </p>
    );
  }

  const saveBalance = async () => {
    const v = parseFloat(balanceInput);
    if (!Number.isFinite(v) || v < 0) {
      toast.error(t("adm_fin_balance_invalid"));
      return;
    }
    setSaving(true);
    try {
      await api.patch("/admin/finance", { replicate_balance_usd: v });
      onSaved();
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const topUp = finance.top_up_recommended_usd ?? finance.replicate_reserve_needed_usd;
  const alert = finance.balance_ok === false;

  return (
    <section data-testid="admin-finance">
      <h2 className="font-heading text-2xl text-rp-text mb-2">{t("adm_tab_finance")}</h2>
      <p className="text-rp-mute text-sm mb-8 max-w-2xl">{t("adm_fin_intro")}</p>

      <div className={`border p-6 mb-10 ${alert ? "border-red-500/50 bg-red-500/5" : "border-rp-purple/40 bg-rp-surface"}`}>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">{t("adm_fin_topup")}</p>
        <p className={`font-heading text-4xl mb-2 ${alert ? "text-red-400" : "text-rp-lavender"}`}>
          ${Number(topUp || 0).toFixed(2)} USD
        </p>
        <p className="text-rp-mute text-sm">{t("adm_fin_topup_hint")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rp-border mb-10">
        <Stat label={t("adm_fin_buyers")} value={finance.unique_buyers} />
        <Stat label={t("adm_fin_purchases")} value={finance.purchases_total} />
        <Stat label={t("adm_fin_credits_sold")} value={finance.credits_sold} />
        <Stat label={t("adm_circulation")} value={finance.credits_in_circulation} />
        <Stat label={t("adm_fin_reserve_needed")} value={`$${finance.replicate_reserve_needed_usd}`} />
        <Stat label={t("adm_fin_reserve_allocated")} value={`$${finance.replicate_reserve_allocated_usd}`} />
        <Stat label={t("adm_fin_margin")} value={`$${finance.estimated_margin_usd_total}`} />
        <Stat label={t("adm_revenue")} value={`€${finance.revenue_eur}`} />
      </div>

      <div className="border border-rp-border p-5 mb-10 max-w-xl">
        <p className="eyebrow mb-3">{t("adm_fin_balance_title")}</p>
        <p className="text-rp-mute text-sm mb-4">{t("adm_fin_balance_hint")}</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="number"
            step="0.01"
            min="0"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            className="field-input w-40 !py-2"
            placeholder="0.00"
            data-testid="replicate-balance-input"
          />
          <span className="self-center text-rp-mute font-mono text-sm">USD</span>
          <button type="button" onClick={saveBalance} disabled={saving} className="btn-primary !py-2 !px-5">
            {saving ? "…" : t("save")}
          </button>
        </div>
        {finance.replicate_balance_usd != null && (
          <p className="text-rp-mute2 text-xs mt-3 font-mono">
            {t("adm_fin_balance_saved")}: ${finance.replicate_balance_usd}
            {finance.balance_ok ? ` · ${t("adm_fin_balance_ok")}` : ` · ${t("adm_fin_balance_low")}`}
          </p>
        )}
      </div>

      <p className="text-rp-mute2 text-xs mb-8 border-l-2 border-rp-border pl-4 max-w-2xl">
        {finance.auto_reload_note}
      </p>

      <h3 className="font-heading text-lg text-rp-text mb-4">{t("adm_fin_recent")}</h3>
      <div className="border border-rp-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
              <th className="text-left p-3">{t("adm_pkg")}</th>
              <th className="text-right p-3">{t("credits")}</th>
              <th className="text-right p-3">{t("adm_amount")}</th>
              <th className="text-right p-3">{t("adm_fin_replicate")}</th>
              <th className="text-right p-3">{t("adm_fin_margin")}</th>
            </tr>
          </thead>
          <tbody>
            {(finance.recent_purchases || []).map((p) => (
              <tr key={p.id || p.stripe_session_id} className="border-b border-rp-border text-rp-text">
                <td className="p-3 font-mono text-xs">{p.package}</td>
                <td className="p-3 text-right font-mono">{p.credits}</td>
                <td className="p-3 text-right font-mono">
                  {p.amount_eur != null ? `€${p.amount_eur}` : p.amount_usd != null ? `$${p.amount_usd}` : "—"}
                </td>
                <td className="p-3 text-right font-mono text-amber-200/90">
                  ${Number(p.replicate_reserve_usd || 0).toFixed(2)}
                </td>
                <td className="p-3 text-right font-mono text-emerald-400/90">
                  ${Number(p.margin_usd || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] font-mono text-rp-mute2 mt-4">
        {t("adm_fin_per_credit")}: ${finance.config?.replicate_usd_per_credit}
      </p>
    </section>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`bg-rp-bg p-6 ${highlight ? "ring-1 ring-red-500/40" : ""}`}>
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">{label}</p>
      <p className={`font-heading text-3xl ${highlight ? "text-red-400" : "text-rp-text"}`}>{value}</p>
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
        <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} className="field-input w-32 !py-2" data-testid="adjust-amount" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="field-input flex-1 !py-2 min-w-[200px]" data-testid="adjust-reason" />
        <button type="button" onClick={() => onConfirm(amount, reason)} className="btn-primary !py-2 !px-5" data-testid="adjust-confirm">{t("apply")}</button>
        <button type="button" onClick={onCancel} className="btn-secondary !py-2 !px-5" data-testid="adjust-cancel">{t("cancel")}</button>
      </div>
    </div>
  );
}
