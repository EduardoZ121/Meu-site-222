import { useMemo } from "react";

import { useI18n } from "../../lib/i18n";

import { MARKETING_VIDEO_DURATION } from "../../lib/marketingVideo";

import CollapsiblePanel from "./CollapsiblePanel";



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



function FormatSection({ formats, formatId, onFormatChange, busy, t, grouped = false }) {

  const formatMap = useMemo(() => {

    const list = formats?.length ? formats : FALLBACK_FORMATS;

    return Object.fromEntries(list.map((f) => [f.id, f]));

  }, [formats]);



  const allFormats = FORMAT_GROUPS.flatMap((g) => g.ids.map((id) => formatMap[id]).filter(Boolean));



  return (

    <CollapsiblePanel

      title={t("mktvid_format")}

      hint={t("mktvid_format_hint")}

      defaultOpen={!grouped}

      testId="mktvid-format-section"

    >

      {grouped ? (

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

                      onClick={() => onFormatChange(f.id)}

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

      ) : (

        <ChipRow testId="mktvid-fmt-quick">

          {allFormats.map((f) => (

            <Chip

              key={f.id}

              row

              active={formatId === f.id}

              disabled={busy}

              onClick={() => onFormatChange(f.id)}

              testId={`mktvid-fmt-${f.id}`}

            >

              {f.label}

            </Chip>

          ))}

        </ChipRow>

      )}

    </CollapsiblePanel>

  );

}

const TEMPLATE_GRADIENTS = {
  character_reveal: "linear-gradient(135deg, #2e1065 0%, #020617 52%, #000 100%)",
  restaurant_blade_chef: "linear-gradient(135deg, #78350f 0%, #171717 55%, #000 100%)",
  fashion_game_intro: "linear-gradient(135deg, #27272a 0%, #1c1917 55%, #000 100%)",
  product_power_trailer: "linear-gradient(135deg, #164e63 0%, #312e81 55%, #000 100%)",
};

function CgiTemplateGrid({ templates, selectedId, onChange, busy, t }) {
  if (!templates?.length) return null;
  return (
    <CollapsiblePanel
      title={t("mktvid_cgi_template_label")}
      hint={t("mktvid_cgi_template_hint")}
      defaultOpen
      testId="mktvid-cgi-template-section"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="mktvid-cgi-template-grid">
        {templates.map((tpl) => {
          const active = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              disabled={busy}
              onClick={() => onChange(tpl.id)}
              data-testid={`mktvid-cgi-template-${tpl.id}`}
              className={[
                "relative overflow-hidden rounded-xl border p-3 text-left min-h-[132px] transition-all",
                active ? "border-violet-400/80 ring-1 ring-violet-400/50" : "border-white/[0.08] hover:border-white/[0.18]",
              ].join(" ")}
              style={{ background: TEMPLATE_GRADIENTS[tpl.id] || "linear-gradient(135deg,#18181b,#000)" }}
            >
              <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.32),transparent_26%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-violet-200/80">
                    {t("mktvid_cgi_template_badge")}
                  </p>
                  <h3 className="mt-1 text-[15px] font-semibold text-white">{tpl.label}</h3>
                  <p className="mt-1 text-[11px] leading-snug text-white/70">{tpl.description}</p>
                </div>
                <p className="text-[10px] leading-snug text-white/60 font-mono">{tpl.accent}</p>
              </div>
            </button>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}

function AdminStoryboard({ template, t }) {
  const beats = template?.beats || [];
  if (!beats.length) return null;
  return (
    <CollapsiblePanel
      title={t("mktvid_cgi_admin_storyboard")}
      hint={t("mktvid_cgi_admin_storyboard_hint")}
      defaultOpen={false}
      testId="mktvid-cgi-admin-storyboard"
    >
      <div className="max-h-72 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 divide-y divide-white/[0.05]">
        {beats.map((b, i) => (
          <div key={`${b.time}-${i}`} className="p-2.5 text-[10px] leading-snug">
            <p className="font-mono text-violet-200">{String(i + 1).padStart(2, "0")} · {b.time}</p>
            <p className="mt-1 text-[#E9E4DC]">{b.action}</p>
            <p className="mt-1 text-[#8A8A8E]">{b.camera} · {b.light} · {b.transition}</p>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
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

  showCgiStoryboard,

  formats,

  formatId,

  onFormatChange,

  cost,

  busy,

}) {

  const { t } = useI18n();

  const isQuick = mode === "quick";
  const isCgi = mode === "cgi_preview";
  const selectedCgiTemplate = useMemo(
    () => (cgiTemplates || []).find((tpl) => tpl.id === cgiTemplateId) || (cgiTemplates || [])[0],
    [cgiTemplateId, cgiTemplates],
  );



  return (

    <div className="space-y-3 md:space-y-4">

      {isQuick ? (

        <section className="mktvid-panel-compact" data-testid="mktvid-quick-section">

          <div className="flex items-center justify-between gap-2 mb-2">

            <h3 className="mktvid-panel-title">{t("mktvid_mode_quick_title")}</h3>

            <span className="text-[9px] text-[#6b6b70] font-mono uppercase">

              {t("mktvid_duration_fixed", { n: MARKETING_VIDEO_DURATION })}

            </span>

          </div>

          <FormatSection

            formats={formats}

            formatId={formatId}

            onFormatChange={onFormatChange}

            busy={busy}

            t={t}

          />

          <p className="mt-2 text-[11px] text-[#C4B5FD] font-mono">{t("mktvid_cost", { n: cost })}</p>

        </section>

      ) : isCgi ? (
        <>
          <section className="mktvid-panel-compact" data-testid="mktvid-cgi-intro">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="mktvid-panel-title">{t("mktvid_mode_cgi_title")}</h3>
              <span className="text-[9px] text-[#C4B5FD] font-mono uppercase">
                {t("mktvid_duration_fixed", { n: MARKETING_VIDEO_DURATION })}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-[#8A8A8E]">{t("mktvid_mode_cgi_hint")}</p>
            <p className="mt-2 text-[11px] text-[#C4B5FD] font-mono">{t("mktvid_cost", { n: cost })}</p>
          </section>

          <CgiTemplateGrid
            templates={cgiTemplates}
            selectedId={cgiTemplateId}
            onChange={onCgiTemplateChange}
            busy={busy}
            t={t}
          />

          {visualStyles.length > 0 && (
            <CollapsiblePanel
              title={t("mktvid_style_label")}
              hint={t("mktvid_cgi_style_hint")}
              defaultOpen={false}
              testId="mktvid-cgi-style-section"
            >
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
            </CollapsiblePanel>
          )}

          {showCgiStoryboard && (
            <AdminStoryboard template={selectedCgiTemplate} t={t} />
          )}

          <FormatSection
            formats={formats}
            formatId={formatId}
            onFormatChange={onFormatChange}
            busy={busy}
            t={t}
            grouped
          />
        </>
      ) : (

        <>

          {categories.length > 0 && (

            <CollapsiblePanel

              title={t("mktvid_category_label")}

              hint={t("mktvid_category_hint")}

              defaultOpen

              testId="mktvid-category-section"

            >

              <ChipRow testId="mktvid-category-chips">

                <Chip

                  row

                  active={!category}

                  disabled={busy}

                  onClick={() => onCategoryChange("")}

                  testId="mktvid-cat-auto"

                >

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

                <p className="mt-2 text-[10px] text-[#C4B5FD]">{t("mktvid_random_hint")}</p>

              )}

            </CollapsiblePanel>

          )}



          {visualStyles.length > 0 && (

            <CollapsiblePanel

              title={t("mktvid_style_label")}

              hint={t("mktvid_style_hint")}

              defaultOpen={false}

              testId="mktvid-style-section"

            >

              <ChipRow testId="mktvid-style-chips">

                <Chip

                  row

                  active={!visualStyle}

                  disabled={busy}

                  onClick={() => onVisualStyleChange("")}

                  testId="mktvid-style-auto"

                >

                  {t("mktvid_style_auto")}

                </Chip>

                <Chip

                  row

                  active={visualStyle === "random"}

                  disabled={busy}

                  highlight

                  onClick={() => onVisualStyleChange("random")}

                  testId="mktvid-style-random"

                >

                  {t("mktvid_style_random")}

                </Chip>

                {visualStyles.map((s) => (

                  <Chip

                    key={s.id}

                    row

                    active={visualStyle === s.id}

                    disabled={busy}

                    onClick={() => onVisualStyleChange(s.id)}

                    testId={`mktvid-style-${s.id}`}

                  >

                    {s.label}

                  </Chip>

                ))}

              </ChipRow>

              {visualStyle === "random" && (

                <p className="mt-2 text-[10px] text-[#C4B5FD]">{t("mktvid_style_random_hint")}</p>

              )}

              <p className="mt-2 text-[11px] text-[#C4B5FD] font-mono">{t("mktvid_cost", { n: cost })}</p>

            </CollapsiblePanel>

          )}



          <FormatSection

            formats={formats}

            formatId={formatId}

            onFormatChange={onFormatChange}

            busy={busy}

            t={t}

            grouped

          />

        </>

      )}

    </div>

  );

}



export { Chip, FormatSection };


