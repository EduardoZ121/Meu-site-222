import { Loader2, RefreshCw } from "lucide-react";

/** Barra fixa de geração no mobile (acima da nav inferior). */
export default function MangaMobileGenerateDock({
  t,
  busy,
  costs,
  onGeneratePanel,
  onGeneratePage,
  onGenerateChapter,
}) {
  return (
    <div className="manga-mobile-gen-dock lg:hidden" data-testid="manga-mobile-gen-dock">
      <button
        type="button"
        disabled={busy}
        onClick={onGeneratePanel}
        className="manga-generate-btn w-full"
        data-testid="manga-gen-panel-mobile"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {t("manga_gen_panel_short", { n: costs?.mangaPanel ?? 15 })}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onGeneratePage}
          className="manga-generate-btn manga-generate-secondary text-[10px] py-2.5"
        >
          {t("manga_gen_page_short", { n: costs?.mangaPage ?? 40 })}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onGenerateChapter}
          className="manga-generate-btn manga-generate-secondary text-[10px] py-2.5"
        >
          {t("manga_gen_chapter_short", { n: costs?.mangaChapter ?? 150 })}
        </button>
      </div>
    </div>
  );
}
