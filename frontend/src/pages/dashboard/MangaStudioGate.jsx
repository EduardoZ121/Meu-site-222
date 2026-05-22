import { Lock } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import MangaStudio from "./MangaStudio";

function MangaComingSoon() {
  const { t } = useI18n();
  useTitle(t("manga_title"));

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      data-testid="manga-studio-locked"
    >
      <div className="w-16 h-16 rounded-2xl border border-[#2E2E30] bg-[#111118] flex items-center justify-center mb-5">
        <Lock className="w-8 h-8 text-[#5A5A5E]" strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/90 mb-2">
        {t("manga_locked_badge")}
      </p>
      <h1 className="text-white text-2xl font-light tracking-tight mb-2">{t("manga_title")}</h1>
      <p className="text-[#9CA3AF] text-sm max-w-md leading-relaxed">{t("manga_locked_desc")}</p>
    </div>
  );
}

/** Só admin acede ao estúdio; restantes vêem aviso «Brevemente». */
export default function MangaStudioGate() {
  const { user } = useAuth();
  if (user?.role === "admin") return <MangaStudio />;
  return <MangaComingSoon />;
}
