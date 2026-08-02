import { useMemo, useState } from "react";
import { Check, Ratio, Sparkles, SlidersHorizontal, Palette, FileText, LayoutGrid } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { MARKETING_VIDEO_DURATION } from "../../lib/marketingVideo";
import SettingCard from "../studio/SettingCard";
import SettingModal from "../studio/SettingModal";

const FORMAT_GROUPS = [
  {
    id: "vertical",
    labelKey: "mktvid_fmt_group_vertical",
    ids: ["tiktok", "reels", "instagram_stories", "shorts", "snapchat", "facebook_reels"],
  },
  {
    id: "square",
    labelKey: "mktvid_fmt_group_square",
    ids: ["instagram_feed", "linkedin"],
  },
  {
    id: "portrait",
    labelKey: "mktvid_fmt_group_portrait",
    ids: ["instagram_portrait"],
  },
  {
    id: "landscape",
    labelKey: "mktvid_fmt_group_landscape",
    ids: ["youtube", "twitter"],
  },
];

const FALLBACK_FORMATS = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "instagram_stories", label: "Stories" },
  { id: "shorts", label: "Shorts" },
  { id: "snapchat", label: "Snapchat" },
  { id: "facebook_reels", label: "FB Reels" },
  { id: "instagram_feed", label: "IG feed" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram_portrait", label: "IG 4:5" },
  { id: "youtube", label: "YouTube" },
  { id: "twitter", label: "X" },
];

const TEMPLATE_GRADIENTS = {
  anime_epic_trailer: "linear-gradient(135deg, #1e3a8a 0%, #312e81 48%, #000 100%)",
  character_reveal: "linear-gradient(135deg, #2e1065 0%, #020617 52%, #000 100%)",
  restaurant_blade_chef: "linear-gradient(135deg, #78350f 0%, #171717 55%, #000 100%)",
  fashion_game_intro: "linear-gradient(135deg, #27272a 0%, #1c1917 55%, #000 100%)",
  product_power_trailer: "linear-gradient(135deg, #164e63 0%, #312e81 55%, #000 100%)",
};

function Chip({ active, disabled, onClick, children, testId, highlight, row = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={[
        "mktvid-chip",
        row ? "mktvid-chip--row shrink-0 snap-start" : "",
        active ? "mktvid-chip-active" : "",
        highlight ? "mktvid-chip-highlight" : "",
      ].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

function ChipRow({ children, testId }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory scrollbar-none -mx-0.5 px-0.5 md:flex-wrap md:overflow-visible md:snap-none md:grid md:grid-cols-3 md:gap-2"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function useFormatMap(formats) {
  return useMemo(() => {
    const list = formats?.length ? formats : FALLBACK_FORMATS;
    return Object.fromEntries(list.map((f) => [f.id, f]));
  }, [formats]);
}

function FormatPickerBody({ formats, formatId, onFormatChange, busy, t, grouped = false, onPick }) {
  const formatMap = useFormatMap(formats);
  const allFormats = FORMAT_GROUPS.flatMap((g) => g.ids.map((id) => formatMap[id]).filter(Boolean));

  const pick = (id) => {
    onFormatChange(id);
    onPick?.(id);
  };

  if (grouped) {
    return (
      <div className="space-y-3">
        {FORMAT_GROUPS.map((group) => {
          const items = group.ids.map((id) => formatMap[id]).filter(Boolean);
          if (!items.length) return null;
          return (
            <div key={group.id}>
              <p className="text-[9px] uppercase tracking-wider text-[#6b6b70] mb-1.5 font-mono">
                {t(group.labelKey)}
              </p>
              <ChipRow testId={`mktvid-fmt-group-${group.id}`}>
                {items.map((f) => (
                  <Chip
                    key={f.id}
                    row
                    active={formatId === f.id}
                    disabled={busy}
                    onClick={() => pick(f.id)}
                    testId={`mktvid-fmt-${f.id}`}
                  >
                    {f.label}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ChipRow testId="mktvid-fmt-quick">
      {allFormats.map((f) => (
        <Chip
          key={f.id}
          row
          active={formatId === f.id}
          disabled={busy}
          onClick={() => pick(f.id)}
          testId={`mktvid-fmt-${f.id}`}
        >
          {f.label}
        </Chip>
      ))}
    </ChipRow>
  );
}

function CgiTemplatePicker({ templates, selectedId, onChange, busy, t, onPick }) {
  if (!templates?.length) {
    return <p className="text-[12px] text-[#8A8A8E]">{t("common_fail")}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="mktvid-cgi-template-grid">
      {templates.map((tpl) => {
        const active = selectedId === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            disabled={busy}
            onClick={() => { onChange(tpl.id); onPick?.(tpl.id); }}
            data-testid={`mktvid-cgi-template-${tpl.id}`}
            className={[
              "relative overflow-hidden rounded-xl border p-3 text-left min-h-[112px] transition-all w-full",
              active ? "border-violet-400/80 ring-1 ring-violet-400/50" : "border-white/[0.08] hover:border-white/[0.18]",
            ].join(" ")}
            style={{ background: TEMPLATE_GRADIENTS[tpl.id] || "linear-gradient(135deg,#18181b,#000)" }}
          >
            <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.32),transparent_26%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-violet-200/80">
                  {t("mktvid_cgi_template_badge")}
                </p>
                <h3 className="mt-1 text-[14px] font-semibold text-white">{tpl.label}</h3>
                <p className="mt-1 text-[11px] leading-snug text-white/70 line-clamp-2">{tpl.description}</p>
              </div>
              {active && <Check className="absolute top-3 right-3 w-4 h-4 text-violet-300" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AdminStoryboardBody({ template, t }) {
  const beats = template?.beats || [];
  if (!beats.length) return null;
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 divide-y divide-white/[0.05]">
      {beats.map((b, i) => (
        <div key={`${b.time}-${i}`} className="p-2.5 text-[10px] leading-snug">
          <p className="font-mono text-violet-200">{String(i + 1).padStart(2, "0")} · {b.time}</p>
          <p className="mt-1 text-[#E9E4DC]">{b.action}</p>
          <p className="mt-1 text-[#8A8A8E]">{b.camera} · {b.light} · {b.transition}</p>
        </div>
      ))}
    </div>
  );
}

export default function MarketingVideoOptions({
  mode,
  categories,
  category,
  onCategoryChange,
  visualStyles,
  visualStyle,
  onVisualStyleChange,
  cgiTemplates,
  cgiTemplateId,
  onCgiTemplateChange,
  customStoryboard = "",
  onCustomStoryboardChange,
  showCgiStoryboard,
  formats,
  formatId,
  onFormatChange,
  cost,
  busy,
}) {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const isQuick = mode === "quick";
  const isCgi = mode === "cgi_preview";
  const formatMap = useFormatMap(formats);

  const selectedCgiTemplate = useMemo(
    () => (cgiTemplates || []).find((tpl) => tpl.id === cgiTemplateId) || (cgiTemplates || [])[0],
    [cgiTemplateId, cgiTemplates],
  );

  const formatLabel = formatMap[formatId]?.label || formatId || "—";
  const optional = t("studio_styles_optional");

  const categoryLabel = !category
    ? t("mktvid_auto_category")
    : categories.find((c) => c.id === category)?.label || category;

  const styleLabel = (() => {
    if (!visualStyle) return isCgi ? t("mktvid_cgi_style_default") : t("mktvid_style_auto");
    if (visualStyle === "random") return t("mktvid_style_random");
    return visualStyles.find((s) => s.id === visualStyle)?.label || visualStyle;
  })();

  const templateLabel = selectedCgiTemplate?.label || optional;
  const storyboardLabel = customStoryboard.trim().length >= 80
    ? `${customStoryboard.trim().slice(0, 38)}…`
    : (customStoryboard.trim() || optional);

  const modalTitle = {
    format: t("mktvid_format"),
    category: t("mktvid_category_label"),
    style: t("mktvid_style_label"),
    template: t("mktvid_cgi_template_label"),
    storyboard: t("mktvid_cgi_custom_label"),
    adminStoryboard: t("mktvid_cgi_admin_storyboard"),
  }[openKey] || "";

  const durationBadge = (
    <p className="text-[10px] text-[#6b6b70] font-mono uppercase mb-2">
      {t("mktvid_duration_fixed", { n: MARKETING_VIDEO_DURATION })}
      {" · "}
      {t("mktvid_cost", { n: cost })}
    </p>
  );

  if (isQuick) {
    return (
      <div className="space-y-2.5" data-testid="mktvid-quick-section">
        {durationBadge}
        <SettingCard
          icon={Ratio}
          label={t("mktvid_format")}
          value={formatLabel}
          onOpen={() => openModal("format")}
          testId="mktvid-card-format"
          helpKey="help_sec_mktvid_format"
        />
        <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_format_hint")}</p>
          <FormatPickerBody
            formats={formats}
            formatId={formatId}
            onFormatChange={onFormatChange}
            busy={busy}
            t={t}
          />
          <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-format-confirm">
            <Check className="w-4 h-4" /> {t("confirm")}
          </button>
        </SettingModal>
      </div>
    );
  }

  if (isCgi) {
    return (
      <div className="space-y-2.5" data-testid="mktvid-cgi-section">
        {durationBadge}
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90">
          {t("mktvid_cgi_motion_warning")}
        </p>
        <p className="text-[11px] leading-snug text-[#8A8A8E] px-0.5">{t("mktvid_mode_cgi_hint")}</p>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Sparkles}
            label={t("mktvid_cgi_template_label")}
            value={templateLabel}
            onOpen={() => openModal("template")}
            testId="mktvid-card-cgi-template"
            helpKey="help_sec_mktvid_cgi_template"
          />
          <SettingCard
            icon={Ratio}
            label={t("mktvid_format")}
            value={formatLabel}
            onOpen={() => openModal("format")}
            testId="mktvid-card-format"
            helpKey="help_sec_mktvid_format"
          />
        </div>

        <SettingCard
          icon={FileText}
          label={t("mktvid_cgi_custom_label")}
          value={storyboardLabel}
          onOpen={() => openModal("storyboard")}
          testId="mktvid-card-cgi-storyboard"
          helpKey="help_sec_mktvid_cgi_storyboard"
        />

        {visualStyles.length > 0 && (
          <SettingCard
            icon={Palette}
            label={t("mktvid_style_label")}
            value={styleLabel}
            onOpen={() => openModal("style")}
            testId="mktvid-card-cgi-style"
            helpKey="help_sec_mktvid_style"
          />
        )}

        {showCgiStoryboard && selectedCgiTemplate?.beats?.length > 0 && (
          <SettingCard
            icon={LayoutGrid}
            label={t("mktvid_cgi_admin_storyboard")}
            value={`${selectedCgiTemplate.beats.length} cenas`}
            onOpen={() => openModal("adminStoryboard")}
            testId="mktvid-card-cgi-admin-storyboard"
          />
        )}

        <SettingModal open={openKey === "template"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_cgi_template_hint")}</p>
          <CgiTemplatePicker
            templates={cgiTemplates}
            selectedId={cgiTemplateId}
            onChange={onCgiTemplateChange}
            busy={busy}
            t={t}
            onPick={() => closeModal()}
          />
        </SettingModal>

        <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_format_hint")}</p>
          <FormatPickerBody
            formats={formats}
            formatId={formatId}
            onFormatChange={onFormatChange}
            busy={busy}
            t={t}
            grouped
          />
          <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-format-confirm">
            <Check className="w-4 h-4" /> {t("confirm")}
          </button>
        </SettingModal>

        <SettingModal open={openKey === "storyboard"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_cgi_custom_hint")}</p>
          <textarea
            value={customStoryboard}
            onChange={(e) => onCustomStoryboardChange?.(e.target.value)}
            disabled={busy}
            rows={10}
            placeholder={t("mktvid_cgi_custom_placeholder")}
            className="rp-editor-textarea rp-editor-textarea--compact min-h-[160px]"
            data-testid="mktvid-cgi-custom-storyboard-input"
          />
          {customStoryboard?.trim()?.length >= 80 ? (
            <p className="mt-2 text-[11px] text-emerald-300/90">{t("mktvid_cgi_custom_active")}</p>
          ) : null}
          <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-storyboard-confirm">
            <Check className="w-4 h-4" /> {t("confirm")}
          </button>
        </SettingModal>

        <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_cgi_style_hint")}</p>
          <ChipRow testId="mktvid-cgi-style-chips">
            <Chip
              row
              active={!visualStyle}
              disabled={busy}
              onClick={() => onVisualStyleChange("")}
              testId="mktvid-cgi-style-default"
            >
              {t("mktvid_cgi_style_default")}
            </Chip>
            {visualStyles.map((s) => (
              <Chip
                key={s.id}
                row
                active={visualStyle === s.id}
                disabled={busy}
                onClick={() => onVisualStyleChange(s.id)}
                testId={`mktvid-cgi-style-${s.id}`}
              >
                {s.label}
              </Chip>
            ))}
          </ChipRow>
          <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-style-confirm">
            <Check className="w-4 h-4" /> {t("confirm")}
          </button>
        </SettingModal>

        <SettingModal open={openKey === "adminStoryboard"} title={modalTitle} onClose={closeModal}>
          <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_cgi_admin_storyboard_hint")}</p>
          <AdminStoryboardBody template={selectedCgiTemplate} t={t} />
          <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-admin-storyboard-confirm">
            <Check className="w-4 h-4" /> {t("confirm")}
          </button>
        </SettingModal>
      </div>
    );
  }

  return (
    <div className="space-y-2.5" data-testid="mktvid-custom-section">
      {durationBadge}
      <div className="mv-setting-grid">
        {categories.length > 0 && (
          <SettingCard
            icon={SlidersHorizontal}
            label={t("mktvid_category_label")}
            value={categoryLabel}
            onOpen={() => openModal("category")}
            testId="mktvid-card-category"
            helpKey="help_sec_mktvid_category"
          />
        )}
        {visualStyles.length > 0 && (
          <SettingCard
            icon={Palette}
            label={t("mktvid_style_label")}
            value={styleLabel}
            onOpen={() => openModal("style")}
            testId="mktvid-card-style"
            helpKey="help_sec_mktvid_style"
          />
        )}
      </div>
      <SettingCard
        icon={Ratio}
        label={t("mktvid_format")}
        value={formatLabel}
        onOpen={() => openModal("format")}
        testId="mktvid-card-format"
        helpKey="help_sec_mktvid_format"
      />

      <SettingModal open={openKey === "category"} title={modalTitle} onClose={closeModal}>
        <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_category_hint")}</p>
        <ChipRow testId="mktvid-category-chips">
          <Chip row active={!category} disabled={busy} onClick={() => onCategoryChange("")} testId="mktvid-cat-auto">
            {t("mktvid_auto_category")}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              row
              active={category === c.id}
              disabled={busy}
              highlight={c.id === "random"}
              onClick={() => onCategoryChange(c.id)}
              testId={`mktvid-cat-${c.id}`}
            >
              {c.label}
            </Chip>
          ))}
        </ChipRow>
        {category === "random" && (
          <p className="mt-2 text-[11px] text-[#C4B5FD]">{t("mktvid_random_hint")}</p>
        )}
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-category-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
        <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_style_hint")}</p>
        <ChipRow testId="mktvid-style-chips">
          <Chip row active={!visualStyle} disabled={busy} onClick={() => onVisualStyleChange("")} testId="mktvid-style-auto">
            {t("mktvid_style_auto")}
          </Chip>
          <Chip row active={visualStyle === "random"} disabled={busy} highlight onClick={() => onVisualStyleChange("random")} testId="mktvid-style-random">
            {t("mktvid_style_random")}
          </Chip>
          {visualStyles.map((s) => (
            <Chip key={s.id} row active={visualStyle === s.id} disabled={busy} onClick={() => onVisualStyleChange(s.id)} testId={`mktvid-style-${s.id}`}>
              {s.label}
            </Chip>
          ))}
        </ChipRow>
        {visualStyle === "random" && (
          <p className="mt-2 text-[11px] text-[#C4B5FD]">{t("mktvid_style_random_hint")}</p>
        )}
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-style-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <p className="text-[12px] text-[#8A8A8E] mb-3 leading-relaxed">{t("mktvid_format_hint")}</p>
        <FormatPickerBody formats={formats} formatId={formatId} onFormatChange={onFormatChange} busy={busy} t={t} grouped />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="mktvid-format-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>
    </div>
  );
}

/** @deprecated use FormatPickerBody inside SettingModal */
function FormatSection(props) {
  const { t } = useI18n();
  return (
    <div data-testid="mktvid-format-section">
      <FormatPickerBody {...props} t={t} />
    </div>
  );
}

export { Chip, FormatSection };
