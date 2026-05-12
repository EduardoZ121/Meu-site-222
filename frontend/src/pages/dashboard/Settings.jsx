import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const ASPECTS = ["1:1", "4:5", "9:16", "16:9", "3:2"];
const PERSONALITIES = ["creative", "technical", "casual", "professional"];

export default function Settings() {
  const { t, lang, switchLang, langs } = useI18n();
  useTitle(t("sidebar_settings"));
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data));
  }, []);

  if (!settings) return <p className="text-rp-mute">{t("loading")}</p>;

  const update = (k, v) => setSettings({ ...settings, [k]: v });
  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      switchLang(settings.lang || lang);
      toast.success(t("set_saved"));
    } catch { toast.error(t("failed")); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-[640px] mx-auto" data-testid="settings-page">
      <p className="eyebrow mb-3">{t("set_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("set_title_a")} <span className="italic text-rp-lavender">{t("set_title_b")}</span>{t("set_title_dot")}</h1>

      <div className="space-y-8">
        <Group label={t("set_aspect")}>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button key={a} onClick={() => update("aspect_ratio_default", a)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${settings.aspect_ratio_default === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`ar-${a}`}>{a}</button>
            ))}
          </div>
        </Group>

        <Group label={t("set_variations")}>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} onClick={() => update("num_variations_default", n)} className={`w-12 h-12 border font-mono ${settings.num_variations_default === n ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}>{n}</button>
            ))}
          </div>
        </Group>

        <Group label={t("set_personality")}>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map((p) => (
              <button key={p} onClick={() => update("personality", p)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${settings.personality === p ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`personality-${p}`}>{t(`pers_${p}`)}</button>
            ))}
          </div>
        </Group>

        <Group label={t("set_language")}>
          <div className="flex flex-wrap gap-2">
            {langs.map((l) => (
              <button key={l} onClick={() => update("lang", l)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${settings.lang === l ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`lang-${l}`}>{l}</button>
            ))}
          </div>
        </Group>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-12 disabled:opacity-50" data-testid="settings-save">
        {saving ? t("saving") : t("set_save")}
      </button>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{label}</p>
      {children}
    </div>
  );
}
