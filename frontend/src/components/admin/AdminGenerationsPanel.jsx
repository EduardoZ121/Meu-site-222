import { useCallback, useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";

const TYPE_OPTS = [
  { value: "all", labelKey: "adm_gen_type_all" },
  { value: "image", labelKey: "adm_gen_type_image" },
  { value: "video", labelKey: "adm_gen_type_video" },
  { value: "poster", labelKey: "adm_gen_type_poster" },
  { value: "manga", labelKey: "adm_gen_type_manga" },
  { value: "carousel", labelKey: "adm_gen_type_carousel" },
];

const WALLET_OPTS = [
  { value: "all", labelKey: "adm_gen_wallet_all" },
  { value: "standard", labelKey: "adm_gen_wallet_standard" },
  { value: "premium", labelKey: "adm_gen_wallet_hq" },
];

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "succeeded") return "text-emerald-400";
  if (s === "failed" || s === "refunded") return "text-red-400";
  if (s === "processing" || s === "starting") return "text-amber-300";
  return "text-rp-mute";
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(String(url || "")) || /video/i.test(String(url || ""));
}

export default function AdminGenerationsPanel({ t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [wallet, setWallet] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "80" });
    if (type && type !== "all") params.set("type", type);
    if (wallet && wallet !== "all") params.set("wallet", wallet);
    if (search.trim()) params.set("search", search.trim());
    if (from) params.set("from", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      params.set("to", end.toISOString());
    }
    api.get(`/admin/generations?${params}`)
      .then((r) => setRows(r.data.generations || []))
      .catch((e) => {
        toast.error(formatApiError(e, t("failed")));
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [type, wallet, search, from, to, t]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section data-testid="admin-generations">
      <h2 className="font-heading text-2xl text-rp-text mb-2">{t("adm_tab_generations")}</h2>
      <p className="text-rp-mute text-sm mb-6">{t("adm_gen_hint")}</p>

      <div className="flex flex-wrap gap-2 mb-6 items-end">
        <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2">
          {t("adm_gen_filter_type")}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="field-input !py-2 !px-3 text-sm mt-1 block min-w-[8rem]"
            data-testid="admin-gen-type"
          >
            {TYPE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2">
          {t("adm_gen_filter_wallet")}
          <select
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="field-input !py-2 !px-3 text-sm mt-1 block min-w-[8rem]"
            data-testid="admin-gen-wallet"
          >
            {WALLET_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2">
          {t("adm_gen_filter_from")}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="field-input !py-2 !px-3 text-sm mt-1 block"
            data-testid="admin-gen-from"
          />
        </label>
        <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2">
          {t("adm_gen_filter_to")}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="field-input !py-2 !px-3 text-sm mt-1 block"
            data-testid="admin-gen-to"
          />
        </label>
        <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2 flex-1 min-w-[12rem]">
          {t("adm_gen_filter_user")}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adm_gen_search_placeholder")}
            className="field-input !py-2 !px-3 text-sm mt-1 block w-full"
            data-testid="admin-gen-search"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="btn-secondary !py-2 !px-4"
          data-testid="admin-gen-refresh"
        >
          {t("search")}
        </button>
      </div>

      {loading && (
        <p className="text-rp-mute text-sm mb-4">{t("adm_loading")}</p>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-rp-mute2 text-sm">{t("adm_gen_empty")}</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="border border-rp-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rp-border text-rp-mute2 text-[10px] uppercase tracking-[0.18em] font-mono">
                <th className="text-left p-3 w-16">{t("adm_gen_col_thumb")}</th>
                <th className="text-left p-3">{t("adm_gen_col_type")}</th>
                <th className="text-left p-3">{t("adm_gen_col_model")}</th>
                <th className="text-right p-3">{t("adm_gen_col_credits")}</th>
                <th className="text-left p-3">{t("adm_gen_col_wallet")}</th>
                <th className="text-left p-3">{t("adm_gen_col_status")}</th>
                <th className="text-left p-3">{t("adm_gen_col_user")}</th>
                <th className="text-left p-3">{t("adm_gen_col_time")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-b border-rp-border text-rp-text align-top" data-testid={`admin-gen-row-${g.id}`}>
                  <td className="p-2">
                    {g.thumb_url ? (
                      isVideoUrl(g.thumb_url) ? (
                        <video
                          src={g.thumb_url}
                          className="w-12 h-12 object-cover bg-rp-surface border border-rp-border"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={g.thumb_url}
                          alt=""
                          className="w-12 h-12 object-cover bg-rp-surface border border-rp-border"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                        />
                      )
                    ) : (
                      <span className="w-12 h-12 bg-rp-surface border border-rp-border text-[9px] text-rp-mute2 flex items-center justify-center font-mono">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs uppercase">{g.type || "—"}</td>
                  <td className="p-3 text-xs text-rp-mute max-w-[10rem] truncate" title={g.model || ""}>{g.model || "—"}</td>
                  <td className="p-3 text-right font-mono">{g.credits_spent ?? 0}</td>
                  <td className="p-3 text-[10px] font-mono uppercase tracking-wider">
                    {g.wallet === "premium" ? t("adm_gen_wallet_hq") : t("adm_gen_wallet_standard")}
                  </td>
                  <td className={`p-3 text-[10px] font-mono uppercase ${statusClass(g.status)}`}>
                    {g.status || "—"}
                  </td>
                  <td className="p-3 text-xs">
                    <div className="text-rp-text">{g.user_email || g.user_id || "—"}</div>
                    {g.user_id && (
                      <div className="text-rp-mute2 font-mono text-[10px] mt-0.5">{g.user_id}</div>
                    )}
                  </td>
                  <td className="p-3 text-[10px] font-mono text-rp-mute2 whitespace-nowrap">
                    {g.created_at ? new Date(g.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

