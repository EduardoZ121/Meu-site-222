import { Link } from "react-router-dom";
import { ArrowLeft, Palette } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export default function ArtisticStudioHeader() {
  const { t } = useI18n();

  return (
    <header className="art-studio-header mb-4 md:mb-6" data-testid="artistic-studio-header">
      <div className="art-studio-header__glow" aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-4 relative z-[1]">
        <div className="flex items-start gap-4 min-w-0">
          <div className="art-studio-header__icon">
            <Palette className="w-6 h-6 text-[#E9D5FF]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[#A855F7] text-[10px] font-mono uppercase tracking-[0.24em] mb-1.5">
              {t("art_brand")}
            </p>
            <h1 className="text-[#F4F1EA] text-[32px] lg:text-[40px] font-light tracking-[-0.03em] leading-[1.08] font-['Inter_Tight']">
              {t("art_hero_title")}
            </h1>
            <p className="text-[#9CA3AF] text-[15px] mt-2 max-w-2xl leading-relaxed">
              {t("art_hero_subtitle")}
            </p>
          </div>
        </div>
        <Link
          to="/app/tools"
          className="art-studio-back shrink-0"
          data-testid="artistic-back-tools"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          {t("art_back")}
        </Link>
      </div>
    </header>
  );
}
