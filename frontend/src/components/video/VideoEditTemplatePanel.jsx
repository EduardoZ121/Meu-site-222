import { useState } from "react";
import { useI18n } from "../../lib/i18n";

import { getV2vTemplateCover, templatesForMode } from "../../lib/videoEditCatalog";



function templateCardClass(active) {

  return [

    "group relative overflow-hidden rounded-xl border text-left transition-all duration-200 w-full",

    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60",

    active

      ? "border-[#7C3AED] shadow-[0_0_28px_-10px_rgba(124,58,237,0.65)] ring-1 ring-[#7C3AED]/40"

      : "border-[#2E2E30] hover:border-[#5A5A5E]",

  ].join(" ");

}



function TemplateThumb({ tpl, label, active, useLabel, compact = false }) {

  const [imgOk, setImgOk] = useState(true);

  const cover = getV2vTemplateCover(tpl.id);



  return (

    <div

      className={`aspect-[4/3] relative overflow-hidden ${

        imgOk ? "bg-[#0A0A0C]" : `bg-gradient-to-br ${tpl.gradient}`

      }`}

    >

      {imgOk && (

        <img

          src={cover}

          alt=""

          loading="lazy"

          decoding="async"

          className="absolute inset-0 w-full h-full object-contain object-center"

          onError={() => setImgOk(false)}

        />

      )}

      {!imgOk && (

        <div

          className="absolute inset-0 opacity-35"

          style={{

            background: `radial-gradient(circle at 28% 22%, ${tpl.accent}66, transparent 58%)`,

          }}

        />

      )}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent ${compact ? "p-1.5" : "p-2.5"}`}>

        <p className={`text-[#F4F1EA] font-medium leading-tight line-clamp-2 ${compact ? "text-[10px]" : "text-[11px]"}`}>

          {label}

        </p>

      </div>

      {active && (

        <span className={`absolute top-1.5 right-1.5 font-mono uppercase tracking-wider rounded bg-[#7C3AED] text-white ${compact ? "text-[7px] px-1 py-0.5" : "text-[8px] px-1.5 py-0.5"}`}>

          {useLabel}

        </span>

      )}

    </div>

  );

}



function TemplateButton({ tpl, label, active, useLabel, compact, disabled, onSelect }) {

  return (

    <button

      type="button"

      disabled={disabled}

      onClick={() => onSelect(tpl)}

      className={templateCardClass(active)}

      data-testid={`video-edit-tpl-${tpl.id}`}

      aria-pressed={active}

    >

      <TemplateThumb tpl={tpl} label={label} active={active} useLabel={useLabel} compact={compact} />

    </button>

  );

}



export default function VideoEditTemplatePanel({

  modeId,

  selectedId,

  onSelect,

  disabled = false,

}) {

  const { t } = useI18n();

  const templates = templatesForMode(modeId);

  const useLabel = t("vid_v2v_use_template");

  const selectedLabel = t("vid_vfx_selected");



  return (

    <div

      className="rounded-xl md:rounded-2xl border border-[#2E2E30] bg-[#0A0A0C]/80 p-3 md:p-5"

      data-testid="video-edit-template-panel"

    >

      <div className="mb-2 md:mb-3">

        <h3 className="text-[#F4F1EA] text-[13px] md:text-[15px] font-medium font-['Inter_Tight']">

          {t("vid_v2v_templates_title")}

        </h3>

        <p className="text-[#6f6f76] text-[10px] md:text-[11px] mt-1 leading-relaxed">

          {t("vid_v2v_templates_hint")}

        </p>

      </div>



      <div className="grid grid-cols-2 gap-2 md:gap-2.5 max-h-none md:max-h-[min(68vh,680px)] md:overflow-y-auto md:overscroll-contain md:min-h-0 md:pr-0.5">

        {templates.map((tpl) => {

          const active = selectedId === tpl.id;

          return (

            <TemplateButton

              key={tpl.id}

              tpl={tpl}

              label={t(tpl.nameKey)}

              active={active}

              useLabel={active ? selectedLabel : useLabel}

              compact

              disabled={disabled}

              onSelect={onSelect}

            />

          );

        })}

      </div>

    </div>

  );

}


