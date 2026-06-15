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



export default function MarketingVideoOptions({

  mode,

  categories,

  category,

  onCategoryChange,

  visualStyles,

  visualStyle,

  onVisualStyleChange,

  formats,

  formatId,

  onFormatChange,

  cost,

  busy,

}) {

  const { t } = useI18n();

  const isQuick = mode === "quick";



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


