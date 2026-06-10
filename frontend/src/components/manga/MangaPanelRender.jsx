import { useMemo } from "react";
import { RefreshCw, Loader2, Sparkles, Check, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

export default function MangaPanelRender({
  panel,
  editorScene,
  readiness,
  costs,
  user,
  busy,
  modelKey,
  onModelKeyChange,
  useGptCompose,
  onUseGptComposeChange,
  onGeneratePanel,
  onGeneratePage,
  onGenerateChapter,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);

  const duoReady =
    editorScene?.duoMode &&
    editorScene?.characterId &&
    editorScene?.partnerCharacterId;

  const panelCost = costs?.mangaPanel ?? 15;
  const panelHint = readiness?.ok
    ? null
    : (readiness?.issues?.[0]?.text || t("manga_ready_no_char"));
  const panelGate = useStudioGenerateGate({
    busy,
    user,
    cost: panelCost,
    readyOverride: Boolean(panel) && Boolean(readiness?.ok),
    hintOverride: panelHint,
  });

  const pageGate = useStudioGenerateGate({
    busy,
    user,
    cost: costs?.mangaPage ?? 40,
    readyOverride: Boolean(panel) && Boolean(readiness?.ok),
    hintOverride: panelHint,
  });

  const chapterGate = useStudioGenerateGate({
    busy,
    user,
    cost: costs?.mangaChapter ?? 150,
    readyOverride: Boolean(panel) && Boolean(readiness?.ok),
    hintOverride: panelHint,
  });

  return (
    <section
      className="rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#111118] p-4 space-y-4"
      data-testid="manga-panel-render"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-white text-[13px] font-semibold">{t("manga_panel_render_title")}</h2>
          <p className="text-[10px] text-[#5A5A5E] mt-0.5">{t("manga_panel_render_desc")}</p>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-amber-200/90 px-2 py-0.5 rounded border border-amber-400/30 bg-amber-500/10">
          {t("manga_flow_step_panel")}
        </span>
      </div>

      <div className="manga-ready-list">
        <p className="text-[10px] uppercase tracking-wider text-[#A855F7] mb-2">
          {t("manga_ready_title")}
        </p>
        {!panel && (
          <p className="text-[10px] text-[#5A5A5E]">{t("manga_select_panel")}</p>
        )}
        {readiness?.issues?.map((item) => (
          <p key={item.id} className="manga-ready-list__item manga-ready-list__item--fail">
            <X className="w-3 h-3 shrink-0" />
            {item.text}
          </p>
        ))}
        {readiness?.warnings?.map((item) => (
          <p key={item.id} className="manga-ready-list__item manga-ready-list__item--warn">
            <span className="w-3 h-3 shrink-0 text-center">!</span>
            {item.text}
          </p>
        ))}
        {readiness?.ok && (
          <p className="manga-ready-list__item manga-ready-list__item--ok">
            <Check className="w-3 h-3 shrink-0" />
            {t("manga_ready_ok")}
          </p>
        )}
      </div>

      {panel?.resultUrl && (
        <div className="rounded-lg overflow-hidden border border-[#2E2E30] aspect-[4/5] max-h-48">
          <img src={panel.resultUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {duoReady && readiness?.ok && (
        <p className="text-[10px] text-[#7c3aed] rounded-md px-2 py-1 border border-[#7c3aed]/30 bg-[#9333EA]/10">
          {t("manga_panel_duo_mode")}
        </p>
      )}

      <div className="space-y-2 p-3 rounded-xl border border-[#2E2E30] bg-[#0B0B0C]/80">
        <span className="text-[10px] uppercase tracking-wider text-[#A855F7]">
          {t("manga_model_engine")}
        </span>
        <div className="flex flex-wrap gap-2">
          {catalog.models.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onModelKeyChange(m.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] border text-left transition-colors ${
                modelKey === m.key
                  ? "border-[#A855F7] bg-[#9333EA]/25 text-white"
                  : "border-[#2E2E30] text-[#9CA3AF] hover:border-[#5A5A5E]"
              }`}
              data-testid={`manga-model-${m.key}`}
            >
              <span className="font-semibold block">{m.label}</span>
              <span className="text-[9px] opacity-80">{m.hint}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[#9CA3AF] cursor-pointer">
          <input
            type="checkbox"
            checked={useGptCompose}
            onChange={(e) => onUseGptComposeChange(e.target.checked)}
            className="rounded border-[#2E2E30]"
          />
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          {t("manga_gpt_compose")}
        </label>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#2E2E30]">
        <button
          type="button"
          disabled={!panelGate.ready || busy}
          onClick={onGeneratePanel}
          className={[
            "rp-action-primary w-full !py-3.5 !text-[13px]",
            panelGate.ready && !busy ? "rp-action-primary--ready" : "",
            !panelGate.ready && !busy ? "rp-action-primary--locked" : "",
          ].filter(Boolean).join(" ")}
          data-testid="manga-gen-panel"
          title={panelGate.hint || undefined}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t("manga_gen_panel_btn", { n: panelCost })}
        </button>
        {panelGate.hint && !busy ? (
          <p className="rp-studio-gen-hint text-left w-full">{panelGate.hint}</p>
        ) : null}

        <details className="manga-panel-advanced">
          <summary className="text-[10px] text-[#9CA3AF] cursor-pointer uppercase tracking-wider py-1">
            {t("manga_panel_advanced")}
          </summary>
          <div className="space-y-2 mt-2">
            <button
              type="button"
              disabled={!pageGate.ready || busy}
              onClick={onGeneratePage}
              className={[
                "rp-action-primary w-full !py-3 !text-[12px] manga-generate-secondary",
                pageGate.ready && !busy ? "rp-action-primary--ready" : "",
                !pageGate.ready && !busy ? "rp-action-primary--locked" : "",
              ].filter(Boolean).join(" ")}
              data-testid="manga-gen-page"
            >
              {t("manga_gen_page_btn", { n: costs?.mangaPage ?? 40 })}
            </button>
            <button
              type="button"
              disabled={!chapterGate.ready || busy}
              onClick={onGenerateChapter}
              className={[
                "rp-action-primary w-full !py-3 !text-[12px] manga-generate-secondary",
                chapterGate.ready && !busy ? "rp-action-primary--ready" : "",
                !chapterGate.ready && !busy ? "rp-action-primary--locked" : "",
              ].filter(Boolean).join(" ")}
              data-testid="manga-gen-chapter"
            >
              {t("manga_gen_chapter_btn", { n: costs?.mangaChapter ?? 150 })}
            </button>
          </div>
        </details>
      </div>
    </section>
  );
}
