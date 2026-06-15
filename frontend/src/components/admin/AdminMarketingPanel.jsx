import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  ImagePlus,
  Loader2,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../../lib/api";
import { uploadImageViaServerProxy } from "../../lib/blobUploadClient";

const CTA_PRESETS = [
  "/app/tools",
  "/app/generate",
  "/app/posters",
  "/app/video",
  "/app/gallery",
  "/app/billing",
  "/app/motion-flyer",
];

function draftFromCampaign(c) {
  if (!c) return null;
  return {
    id: c.id,
    title: c.title || "",
    subject: c.subject || "",
    preheader: c.preheader || "",
    heroImage: c.heroImageRaw || c.heroImage || "",
    badge: c.badge || "",
    headline: c.headline || "",
    subheadline: c.subheadline || "",
    paragraphs: [...(c.paragraphs || [])],
    bullets: [...(c.bullets || [])],
    highlight: c.highlight
      ? { label: c.highlight.label || "", value: c.highlight.value || "", sub: c.highlight.sub || "" }
      : null,
    showHighlight: Boolean(c.highlight?.label || c.highlight?.value || c.highlight?.sub),
    ctaPrimary: {
      label: c.ctaPrimary?.label || "",
      url: c.ctaPrimary?.url || "/app/tools",
    },
    ctaSecondary: c.ctaSecondary
      ? { label: c.ctaSecondary.label || "", url: c.ctaSecondary.url || "" }
      : { label: "", url: "" },
    showSecondary: Boolean(c.ctaSecondary?.label && c.ctaSecondary?.url),
  };
}

function payloadFromDraft(draft) {
  return {
    title: draft.title,
    subject: draft.subject,
    preheader: draft.preheader,
    heroImage: draft.heroImage,
    badge: draft.badge,
    headline: draft.headline,
    subheadline: draft.subheadline,
    paragraphs: draft.paragraphs.filter(Boolean),
    bullets: draft.bullets.filter(Boolean),
    highlight: draft.showHighlight
      ? {
          label: draft.highlight?.label || "",
          value: draft.highlight?.value || "",
          sub: draft.highlight?.sub || "",
        }
      : null,
    ctaPrimary: draft.ctaPrimary,
    ctaSecondary: draft.showSecondary && draft.ctaSecondary?.label && draft.ctaSecondary?.url
      ? draft.ctaSecondary
      : null,
  };
}

function ListEditor({ label, items, onChange, placeholder, t }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-rp-mute uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-[11px] text-rp-lavender hover:text-rp-text flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          {t("adm_mkt_add_line")}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((line, i) => (
          <div key={`${label}-${i}`} className="flex gap-2">
            <input
              type="text"
              value={line}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="field-input flex-1 !py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="px-2 text-rp-mute hover:text-red-400"
              aria-label={t("adm_mkt_remove_line")}
            >
              ×
            </button>
          </div>
        ))}
        {!items.length && (
          <button
            type="button"
            onClick={() => onChange([""])}
            className="text-xs text-rp-mute hover:text-rp-lavender"
          >
            + {t("adm_mkt_add_line")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminMarketingPanel({ t }) {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const previewTimer = useRef(null);
  const heroInputRef = useRef(null);

  const dirty = useMemo(
    () => Boolean(draft && savedSnapshot && JSON.stringify(draft) !== savedSnapshot),
    [draft, savedSnapshot],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/marketing/campaigns");
      const list = data?.campaigns || [];
      setCampaigns(list);
      setAudienceCount(data?.audience_count || 0);
      setSelectedId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id || "";
      });
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_load_fail")));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const selectCampaign = useCallback((c) => {
    if (!c) return;
    const d = draftFromCampaign(c);
    setDraft(d);
    setSavedSnapshot(JSON.stringify(d));
    setPreviewHtml(c.preview_html || "");
    setSelectedId(c.id);
    setIsNew(false);
  }, []);

  useEffect(() => {
    if (loading || isNew || !selectedId) return;
    const c = campaigns.find((x) => x.id === selectedId);
    if (c) selectCampaign(c);
  }, [loading, selectedId, campaigns, isNew, selectCampaign]);

  const refreshPreview = useCallback(async (payload) => {
    setPreviewLoading(true);
    try {
      const { data } = await api.post("/admin/marketing/preview", payload);
      setPreviewHtml(data?.preview_html || "");
    } catch {
      /* preview is best-effort */
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!draft) return undefined;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      refreshPreview(payloadFromDraft(draft));
    }, 450);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [draft, refreshPreview]);

  const patchDraft = (patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const confirmDiscard = () => {
    if (!dirty) return true;
    return window.confirm(t("adm_mkt_discard_confirm"));
  };

  const handleSelect = (c) => {
    if (c.id === selectedId && !isNew) return;
    if (!confirmDiscard()) return;
    selectCampaign(c);
  };

  const startNew = async () => {
    if (!confirmDiscard()) return;
    setIsNew(true);
    setSelectedId("");
    const blank = {
      id: "",
      title: t("adm_mkt_new_default_title"),
      subject: t("adm_mkt_new_default_subject"),
      preheader: "",
      heroImage: "",
      badge: "PROMO",
      headline: t("adm_mkt_new_default_headline"),
      subheadline: "",
      paragraphs: [""],
      bullets: [],
      highlight: { label: "", value: "", sub: "" },
      showHighlight: false,
      ctaPrimary: { label: t("adm_mkt_new_default_cta"), url: "/app/tools" },
      ctaSecondary: { label: "", url: "" },
      showSecondary: false,
    };
    setDraft(blank);
    setSavedSnapshot(JSON.stringify(blank));
    setPreviewHtml("");
  };

  const saveCampaign = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = payloadFromDraft(draft);
      if (isNew || !draft.id) {
        const { data } = await api.post("/admin/marketing/campaigns", payload);
        toast.success(t("adm_mkt_saved"));
        setIsNew(false);
        await load();
        if (data?.id) {
          setSelectedId(data.id);
          const d = draftFromCampaign(data);
          setDraft(d);
          setSavedSnapshot(JSON.stringify(d));
          setPreviewHtml(data.preview_html || "");
        }
      } else {
        const { data } = await api.patch(`/admin/marketing/campaigns/${draft.id}`, payload);
        toast.success(t("adm_mkt_saved"));
        setCampaigns((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
        const d = draftFromCampaign(data);
        setDraft(d);
        setSavedSnapshot(JSON.stringify(d));
        setPreviewHtml(data.preview_html || "");
      }
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_save_fail")));
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async () => {
    if (!draft?.id || isNew) return;
    if (!window.confirm(t("adm_mkt_delete_confirm", { title: draft.title }))) return;
    try {
      await api.delete(`/admin/marketing/campaigns/${draft.id}`);
      toast.success(t("adm_mkt_deleted"));
      setDraft(null);
      setSelectedId("");
      setIsNew(false);
      await load();
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_delete_fail")));
    }
  };

  const uploadHero = async (file) => {
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadImageViaServerProxy(file, { timeoutMs: 120_000 });
      patchDraft({ heroImage: url });
      toast.success(t("adm_mkt_image_ok"));
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_image_fail")));
    } finally {
      setUploadingHero(false);
    }
  };

  const sendOne = async () => {
    if (!draft?.id || isNew) {
      toast.error(t("adm_mkt_save_before_send"));
      return;
    }
    if (dirty) {
      toast.error(t("adm_mkt_save_before_send"));
      return;
    }
    const email = testEmail.trim();
    if (!email) {
      toast.error(t("adm_mkt_email_required"));
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/admin/marketing/send", {
        campaign_id: draft.id,
        email,
      });
      if (data?.sent) {
        toast.success(t("adm_mkt_sent_one", { email }));
      } else {
        toast.error(t("adm_mkt_send_fail"));
      }
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_send_fail")));
    } finally {
      setSending(false);
    }
  };

  const sendAll = async () => {
    if (!draft?.id || isNew) {
      toast.error(t("adm_mkt_save_before_send"));
      return;
    }
    if (dirty) {
      toast.error(t("adm_mkt_save_before_send"));
      return;
    }
    const ok = window.confirm(
      t("adm_mkt_confirm_all", { count: audienceCount, subject: draft.subject }),
    );
    if (!ok) return;

    setBroadcasting(true);
    let cursor = 0;
    let totalSent = 0;
    let totalFailed = 0;
    setBroadcastProgress({ cursor: 0, total: audienceCount });

    try {
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { data } = await api.post("/admin/marketing/send-batch", {
          campaign_id: draft.id,
          cursor,
          batch_size: 20,
        });
        totalSent += data?.sent || 0;
        totalFailed += data?.failed || 0;
        cursor = data?.next_cursor ?? cursor;
        setBroadcastProgress({ cursor, total: data?.total || audienceCount });
        if (data?.done) break;
      }
      toast.success(t("adm_mkt_sent_all", { sent: totalSent, failed: totalFailed }));
    } catch (err) {
      toast.error(formatApiError(err, t("adm_mkt_send_fail")));
    } finally {
      setBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  if (loading) {
    return <p className="text-rp-mute text-sm">{t("adm_loading")}</p>;
  }

  const heroPreview = draft?.heroImage
    ? (draft.heroImage.startsWith("http") ? draft.heroImage : `https://www.remakepix.com${draft.heroImage}`)
    : "";

  return (
    <section data-testid="admin-marketing">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl text-rp-text mb-1">{t("adm_tab_marketing")}</h2>
          <p className="text-rp-mute text-sm max-w-2xl">{t("adm_mkt_intro")}</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="btn-secondary !py-2 !px-4 flex items-center gap-2"
          data-testid="admin-mkt-new"
        >
          <Plus className="w-4 h-4" />
          {t("adm_mkt_new")}
        </button>
      </div>

      <div className="border border-rp-purple/30 bg-rp-surface/40 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-rp-text">
            <Users className="w-4 h-4 text-rp-lavender" />
            <span className="text-sm">
              {t("adm_mkt_audience")}: <strong className="font-mono">{audienceCount}</strong>
            </span>
          </div>
          {broadcastProgress && (
            <span className="text-xs text-amber-300 font-mono">
              {t("adm_mkt_broadcast_progress", {
                cursor: broadcastProgress.cursor,
                total: broadcastProgress.total,
              })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t("adm_mkt_email_placeholder")}
            className="field-input flex-1 min-w-[200px] !py-2"
            data-testid="admin-mkt-email"
          />
          <button
            type="button"
            disabled={sending || broadcasting || !draft?.id}
            onClick={sendOne}
            className="btn-secondary !py-2 !px-4 flex items-center gap-2"
            data-testid="admin-mkt-send-one"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t("adm_mkt_send_one")}
          </button>
          <button
            type="button"
            disabled={sending || broadcasting || !draft?.id || audienceCount < 1}
            onClick={sendAll}
            className="btn-primary !py-2 !px-4 flex items-center gap-2"
            data-testid="admin-mkt-send-all"
          >
            {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t("adm_mkt_send_all")}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className={`w-full text-left border p-2 transition-colors ${
                selectedId === c.id && !isNew
                  ? "border-rp-purple bg-rp-surface"
                  : "border-rp-border hover:border-rp-purple/50"
              }`}
              data-testid={`admin-mkt-campaign-${c.id}`}
            >
              {c.heroImage ? (
                <img src={c.heroImage} alt="" className="w-full aspect-[2.1/1] object-cover rounded-sm mb-2" />
              ) : (
                <div className="w-full aspect-[2.1/1] bg-rp-bg border border-dashed border-rp-border mb-2 flex items-center justify-center text-rp-mute2 text-xs">
                  {t("adm_mkt_no_image")}
                </div>
              )}
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90 mb-0.5">{c.badge}</p>
              <p className="text-sm font-medium text-rp-text line-clamp-1">{c.title}</p>
            </button>
          ))}
          {isNew && (
            <div className="border border-dashed border-rp-purple p-3 text-sm text-rp-lavender">
              {t("adm_mkt_editing_new")}
            </div>
          )}
        </div>

        {draft ? (
          <div className="border border-rp-border bg-rp-surface/30 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2 justify-between sticky top-0 bg-rp-surface/95 backdrop-blur py-2 -mt-2 z-10 border-b border-rp-border mb-2">
              <p className="eyebrow">{t("adm_mkt_editor")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || !dirty}
                  onClick={saveCampaign}
                  className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {dirty ? t("adm_mkt_save") : t("adm_mkt_saved_short")}
                </button>
                {!isNew && draft.id && (
                  <button
                    type="button"
                    onClick={deleteCampaign}
                    className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("adm_mkt_delete")}
                  </button>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_title")}</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_subject")}</label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => patchDraft({ subject: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_preheader")}</label>
                <input
                  type="text"
                  value={draft.preheader}
                  onChange={(e) => patchDraft({ preheader: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_badge")}</label>
                <input
                  type="text"
                  value={draft.badge}
                  onChange={(e) => patchDraft({ badge: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_headline")}</label>
                <input
                  type="text"
                  value={draft.headline}
                  onChange={(e) => patchDraft({ headline: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-rp-mute">{t("adm_mkt_field_subheadline")}</label>
                <input
                  type="text"
                  value={draft.subheadline}
                  onChange={(e) => patchDraft({ subheadline: e.target.value })}
                  className="field-input w-full !py-1.5 text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-rp-mute">{t("adm_mkt_field_hero")}</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <input
                  type="text"
                  value={draft.heroImage}
                  onChange={(e) => patchDraft({ heroImage: e.target.value })}
                  placeholder="https://… ou /marketing-email/…"
                  className="field-input flex-1 min-w-[200px] !py-1.5 text-sm"
                />
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => uploadHero(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={uploadingHero}
                  onClick={() => heroInputRef.current?.click()}
                  className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                >
                  {uploadingHero ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {t("adm_mkt_upload_image")}
                </button>
              </div>
              {heroPreview && (
                <img src={heroPreview} alt="" className="mt-2 w-full max-h-36 object-cover border border-rp-border" />
              )}
            </div>

            <ListEditor
              label={t("adm_mkt_field_paragraphs")}
              items={draft.paragraphs}
              onChange={(paragraphs) => patchDraft({ paragraphs })}
              placeholder={t("adm_mkt_paragraph_ph")}
              t={t}
            />

            <ListEditor
              label={t("adm_mkt_field_bullets")}
              items={draft.bullets}
              onChange={(bullets) => patchDraft({ bullets })}
              placeholder={t("adm_mkt_bullet_ph")}
              t={t}
            />

            <div className="border border-rp-border p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm text-rp-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showHighlight}
                  onChange={(e) => patchDraft({ showHighlight: e.target.checked })}
                />
                {t("adm_mkt_field_highlight")}
              </label>
              {draft.showHighlight && (
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={draft.highlight?.label || ""}
                    onChange={(e) => patchDraft({ highlight: { ...draft.highlight, label: e.target.value } })}
                    placeholder={t("adm_mkt_highlight_label")}
                    className="field-input !py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={draft.highlight?.value || ""}
                    onChange={(e) => patchDraft({ highlight: { ...draft.highlight, value: e.target.value } })}
                    placeholder={t("adm_mkt_highlight_value")}
                    className="field-input !py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={draft.highlight?.sub || ""}
                    onChange={(e) => patchDraft({ highlight: { ...draft.highlight, sub: e.target.value } })}
                    placeholder={t("adm_mkt_highlight_sub")}
                    className="field-input !py-1.5 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="border border-rp-border p-3 space-y-3">
              <p className="text-xs text-rp-mute uppercase tracking-wider">{t("adm_mkt_field_cta_primary")}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draft.ctaPrimary.label}
                  onChange={(e) => patchDraft({ ctaPrimary: { ...draft.ctaPrimary, label: e.target.value } })}
                  placeholder={t("adm_mkt_cta_label_ph")}
                  className="field-input !py-1.5 text-sm"
                />
                <input
                  type="text"
                  list="mkt-cta-urls"
                  value={draft.ctaPrimary.url}
                  onChange={(e) => patchDraft({ ctaPrimary: { ...draft.ctaPrimary, url: e.target.value } })}
                  placeholder="/app/…"
                  className="field-input !py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="border border-rp-border p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-rp-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showSecondary}
                  onChange={(e) => patchDraft({ showSecondary: e.target.checked })}
                />
                {t("adm_mkt_field_cta_secondary")}
              </label>
              {draft.showSecondary && (
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={draft.ctaSecondary.label}
                    onChange={(e) => patchDraft({ ctaSecondary: { ...draft.ctaSecondary, label: e.target.value } })}
                    placeholder={t("adm_mkt_cta_label_ph")}
                    className="field-input !py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    list="mkt-cta-urls"
                    value={draft.ctaSecondary.url}
                    onChange={(e) => patchDraft({ ctaSecondary: { ...draft.ctaSecondary, url: e.target.value } })}
                    placeholder="/app/…"
                    className="field-input !py-1.5 text-sm"
                  />
                </div>
              )}
            </div>

            <datalist id="mkt-cta-urls">
              {CTA_PRESETS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        ) : (
          <div className="border border-dashed border-rp-border p-8 text-center text-rp-mute text-sm">
            {t("adm_mkt_pick_campaign")}
          </div>
        )}

        <div className="border border-rp-border bg-rp-bg overflow-hidden max-h-[80vh] flex flex-col">
          <div className="p-3 border-b border-rp-border bg-rp-surface/50 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-0.5 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {t("adm_mkt_preview")}
              </p>
              <p className="text-[11px] text-rp-mute font-mono line-clamp-1">{draft?.subject}</p>
            </div>
            {previewLoading && <Loader2 className="w-4 h-4 animate-spin text-rp-mute" />}
          </div>
          <iframe
            title={draft?.title || "preview"}
            srcDoc={previewHtml || `<p style="font-family:sans-serif;padding:24px;color:#666">${t("adm_mkt_preview_empty")}</p>`}
            className="w-full flex-1 min-h-[480px] bg-white"
            sandbox=""
          />
        </div>
      </div>

      <p className="text-rp-mute2 text-xs mt-6 max-w-3xl">{t("adm_mkt_footer")}</p>
    </section>
  );
}
