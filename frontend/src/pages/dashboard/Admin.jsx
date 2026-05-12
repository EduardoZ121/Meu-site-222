import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

export default function Admin() {
  useTitle("Admin");
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
      toast.success("Credits adjusted");
      reload();
    } catch { toast.error("Failed"); }
  };

  const patchUser = async (uid, patch) => {
    try {
      await api.patch(`/admin/users/${uid}`, patch);
      toast.success("Updated");
      reload();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-[1300px] mx-auto" data-testid="admin-page">
      <p className="eyebrow mb-3">Admin</p>
      <h1 className="heading-xl mb-10">Operations.</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-rp-border mb-12" data-testid="admin-stats">
        {stats && (
          <>
            <Stat label="Users" value={stats.users} />
            <Stat label="Creations" value={stats.creations} />
            <Stat label="Purchases" value={stats.purchases} />
            <Stat label="Revenue" value={`€${stats.revenue_eur?.toFixed(2)}`} />
            <Stat label="Credits in circulation" value={stats.credits_in_circulation} />
          </>
        )}
      </div>

      {/* Users */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-heading text-2xl text-rp-text">Users</h2>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="email…" className="field-input !py-2 !px-3" data-testid="admin-search" />
            <button onClick={reload} className="btn-secondary !py-2 !px-4" data-testid="admin-search-btn">Search</button>
          </div>
        </div>
        <div className="border border-rp-border overflow-x-auto" data-testid="admin-users-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-right p-3">Credits</th>
                <th className="text-center p-3">Banned</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-rp-border last:border-b-0 text-rp-text">
                  <td className="p-3"><span className="text-rp-text">{u.email}</span><br/><span className="text-rp-mute2 text-[10px] font-mono">{u.id}</span></td>
                  <td className="p-3"><span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.role === "admin" ? "text-rp-lavender" : "text-rp-mute"}`}>{u.role}</span></td>
                  <td className="p-3 text-right font-mono">{u.credits}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => patchUser(u.id, { banned: !u.banned })} className={`text-[10px] font-mono uppercase tracking-[0.16em] ${u.banned ? "text-red-400" : "text-rp-mute"}`} data-testid={`ban-${u.id}`}>{u.banned ? "Yes" : "No"}</button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setAdjustOpen(adjustOpen === u.id ? null : u.id)} className="btn-ghost" data-testid={`adjust-${u.id}`}>Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adjustOpen && (
          <AdjustCreditsForm
            userId={adjustOpen}
            onCancel={() => setAdjustOpen(null)}
            onConfirm={(amt, reason) => { adjustCredits(adjustOpen, amt, reason); setAdjustOpen(null); }}
          />
        )}
      </section>

      {/* Transactions */}
      <section>
        <h2 className="font-heading text-2xl text-rp-text mb-6">Recent transactions</h2>
        <div className="border border-rp-border" data-testid="admin-txs">
          {txs.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between px-4 py-3 ${i < txs.length - 1 ? "border-b border-rp-border" : ""}`}>
              <div>
                <p className="text-rp-text text-sm">{t.description || t.type}</p>
                <p className="text-rp-mute2 text-[10px] font-mono">{t.user_id} · {new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`font-mono text-sm ${t.amount > 0 ? "text-rp-lavender" : "text-rp-mute"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
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

function AdjustCreditsForm({ userId, onCancel, onConfirm }) {
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState("admin grant");
  return (
    <div className="border border-rp-purple mt-3 p-5 bg-rp-surface" data-testid="adjust-form">
      <p className="eyebrow mb-3">Adjust credits — {userId.slice(0, 8)}…</p>
      <div className="flex gap-3 flex-wrap">
        <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0"))} className="field-input w-32 !py-2" data-testid="adjust-amount" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="field-input flex-1 !py-2 min-w-[200px]" data-testid="adjust-reason" />
        <button onClick={() => onConfirm(amount, reason)} className="btn-primary !py-2 !px-5" data-testid="adjust-confirm">Apply</button>
        <button onClick={onCancel} className="btn-secondary !py-2 !px-5" data-testid="adjust-cancel">Cancel</button>
      </div>
    </div>
  );
}
