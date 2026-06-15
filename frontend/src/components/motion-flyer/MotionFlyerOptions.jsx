import { useMemo } from "react";
import { useI18n } from "../../lib/i18n";
import { MOTION_FLYER_DURATION } from "../../lib/motionFlyer";

export default function MotionFlyerOptions({ imageAspect, cost, busy }) {
  const { t } = useI18n();

  const aspectLabel = useMemo(() => {
    if (!imageAspect?.ratio) return null;
    const dims = imageAspect.width && imageAspect.height
      ? ` · ${imageAspect.width}×${imageAspect.height}px`
      : "";
    return `${imageAspect.ratio}${dims}`;
  }, [imageAspect]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.08] bg-[#0B0B0C]/60 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wider text-[#6b6b70] mb-1">{t("mfly_aspect_title")}</p>
        <p className="text-[11px] text-[#C4B5FD] leading-relaxed">{t("mfly_aspect_hint")}</p>
        <p className="mt-2 text-[12px] font-mono text-[#E9E4DC]" data-testid="mfly-aspect-detected">
          {aspectLabel || t("mfly_aspect_pending")}
        </p>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
        <p className="text-[11px] text-[#C4B5FD]">{t("mfly_auto_hint")}</p>
        <p className="mt-1.5 text-[11px] text-[#8A8A8E]">
          {t("mfly_duration_fixed", { n: MOTION_FLYER_DURATION })}
        </p>
        <p className="mt-1 text-[11px] text-[#C4B5FD] font-mono">{t("mfly_cost", { n: cost })}</p>
      </div>
    </div>
  );
}
