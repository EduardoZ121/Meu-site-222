import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, BookOpen, FolderOpen, Loader2, Plus, AlertCircle, Sparkles,
  GraduationCap, Sparkle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError, pollPrediction, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { composeMangaPromptApi } from "../../lib/composeMangaPromptApi";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import {
  createNewProject,
  loadActiveProject,
  listProjects,
  saveProject,
} from "../../lib/mangaStudioStorage";
import { createDemoMangaProject } from "../../lib/comic-engine/mockData";
import { fetchCoherenceCheck } from "../../lib/comic-engine/coherenceCheck";
import useTitle from "../../lib/useTitle";
import { toast } from "sonner";
import MangaLibrarySidebar from "../../components/manga/MangaLibrarySidebar";
import MangaPageCanvas from "../../components/manga/MangaPageCanvas";
import MangaPanelEditor from "../../components/manga/MangaPanelEditor";
import StoryNavigator from "../../components/manga/StoryNavigator";
import CoherenceCheckPanel from "../../components/manga/CoherenceCheckPanel";
import MangaStudioTour, { isTourDone } from "../../components/manga/MangaStudioTour";

const CREDIT_DEFAULTS = { mangaPanel: 15, mangaPage: 40, mangaChapter: 150 };

export default function MangaStudio() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const errMsg = (err) => formatApiError(err, t("manga_fail"));
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  useTitle(t("manga_title"));
  const { user, refresh } = useAuth();
  const { costs, ready: pricingReady } = usePricing();

  const creditCosts = useMemo(
    () => ({
      mangaPanel: costs.mangaPanel ?? CREDIT_DEFAULTS.mangaPanel,
      mangaPage: costs.mangaPage ?? CREDIT_DEFAULTS.mangaPage,
      mangaChapter: costs.mangaChapter ?? CREDIT_DEFAULTS.mangaChapter,
      artistic: costs.artistic ?? 18,
    }),
    [costs],
  );

  const [project, setProject] = useState(() => loadActiveProject());
  const [activePanelId, setActivePanelId] = useState(null);
  const [mobileTab, setMobileTab] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [modelKey, setModelKey] = useState("grok");
  const [useGptCompose, setUseGptCompose] = useState(false);
  const [lastPromptPreview, setLastPromptPreview] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [coherenceOpen, setCoherenceOpen] = useState(false);
  const [coherenceResult, setCoherenceResult] = useState({ score: null, warnings: [] });
  const [coherenceLoading, setCoherenceLoading] = useState(false);
  const saveSkipRef = useRef(true);

  useEffect(() => {
    if (!isTourDone() && !project.tourCompleted) {
      const timer = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [project.tourCompleted]);

  useEffect(() => {
    if (!activePanelId && project.panels?.length) {
      setActivePanelId(project.panels[0].id);
    }
  }, [project.panels, activePanelId]);

  useEffect(() => {
    if (saveSkipRef.current) {
      saveSkipRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      const { warning } = saveProject(project);
      if (warning) setStatusLine(warning);
    }, 700);
    return () => clearTimeout(timer);
  }, [project]);

  const activePanel = useMemo(
    () => project.panels?.find((p) => p.id === activePanelId) || null,
    [project.panels, activePanelId],
  );

  const updateProject = useCallback((next) => {
    setProject(next);
  }, []);

  const patchPanel = useCallback((patch) => {
    if (!activePanelId) return;
    setProject((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === activePanelId ? { ...p, ...patch } : p)),
    }));
  }, [activePanelId]);

  const applyResultToPanel = (panelId, url) => {
    setProject((prev) => ({
      ...prev,
      panels: prev.panels.map((p) =>
        p.id === panelId ? { ...p, resultUrl: url, status: "completed" } : p),
    }));
  };

  const resolveModelKey = () => {
    const char = project.characters?.find((c) => c.id === activePanel?.characterId);
    const hasRef = Boolean(char?._refFile || char?.thumb || char?.sheets?.front);
    if (modelKey === "gpt_image" && hasRef) {
      toast.info(t("manga_err_gpt_photo"));
      return "grok";
    }
    return modelKey;
  };

  const runGeneration = async (endpoint, cost, prompt, aspect = "4:5") => {
    if (!prompt || prompt.trim().length < 12) {
      throw new Error(t("manga_err_prompt_short"));
    }
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      const msg = t("manga_err_credits", { need: cost, have: user?.credits ?? 0 });
      setStatusLine(msg);
      toast.error(msg);
      return null;
    }

    const effectiveModel = resolveModelKey();
    const apiPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const char = (project.characters || []).find((c) => c.id === activePanel?.characterId);
    const refFile = char?._refFile || null;
    const refUrl = char?.sheets?.front || char?.thumb;
    let photoBlob = null;

    if (effectiveModel === "grok" && refFile instanceof Blob) {
      photoBlob = refFile;
    } else if (effectiveModel === "grok" && refUrl?.startsWith?.("data:")) {
      try {
        const res = await fetch(refUrl);
        photoBlob = await res.blob();
      } catch {
        /* texto apenas */
      }
    }

    setStatusLine(t("manga_status_start"));
    let submitData;

    if (photoBlob && photoBlob.size > 0 && photoBlob.size < 3_500_000) {
      const fd = new FormData();
      fd.append("prompt_final", prompt.trim());
      fd.append("aspect_ratio", aspect);
      fd.append("model_key", effectiveModel);
      fd.append("photo", photoBlob, "character-ref.png");
      const { data } = await uploadPost(apiPath, fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      });
      submitData = data;
    } else {
      const { data } = await api.post(
        apiPath,
        {
          prompt_final: prompt.trim(),
          aspect_ratio: aspect,
          model_key: effectiveModel,
        },
        { timeout: 90000, headers: { "X-Skip-Auto-Poll": "1" } },
      );
      submitData = data;
    }

    if (!submitData?.prediction_id) {
      const direct = submitData?.creation?.result_urls?.[0];
      if (direct) {
        await refresh();
        return {
          url: direct,
          spent: submitData?.creation?.credits_spent ?? submitData?.credits_spent ?? cost,
        };
      }
      throw new Error(submitData?.detail || t("manga_err_no_prediction"));
    }

    setStatusLine(t("manga_status_generating"));
    const polled = await pollPrediction(submitData.prediction_id, {
      credits_spent: submitData.credits_spent ?? cost,
      type: "manga",
      timeoutMs: 300000,
      onTick: (sec) => setStatusLine(t("manga_status_generating_sec", { n: sec })),
    });

    const url = polled?.creation?.result_urls?.[0];
    if (!url) throw new Error(t("manga_err_no_url"));
    await refresh();
    setStatusLine("");
    return {
      url,
      spent: polled?.creation?.credits_spent ?? submitData.credits_spent ?? cost,
    };
  };

  const composeThenGenerate = async ({
    mode,
    endpoint,
    cost,
    aspect,
    panelOverride,
    panelsOverride,
  }) => {
    const panel = panelOverride || activePanel;
    if (mode === "panel" && !panel) {
      toast.error(t("manga_select_panel_toast"));
      return;
    }

    const char = (project.characters || []).find((c) => c.id === panel?.characterId);
    const scene = (project.scenarios || []).find((s) => s.id === panel?.scenarioId);
    const panels = panelsOverride || [...(project.panels || [])].sort((a, b) => a.order - b.order);

    if (activePanelId && mode === "panel") {
      patchPanel({ status: "generating" });
    }

    setBusy(true);
    setStatusLine(useGptCompose ? t("manga_status_compose_gpt") : t("manga_status_compose"));

    try {
      const { prompt, source } = await composeMangaPromptApi({
        mode,
        panel,
        panels,
        project,
        character: char,
        scenario: scene,
        lang: lang || "en",
        useGpt: useGptCompose,
      });
      setLastPromptPreview(prompt);
      if (source === "gpt") {
        toast.message(t("manga_prompt_gpt_toast"));
      }

      let res;
      try {
        res = await runGeneration(endpoint, cost, prompt, aspect);
      } catch (primaryErr) {
        const isServerDown = /indisponível|FUNCTION_INVOCATION|500|502|503/i.test(
          String(primaryErr?.message || ""),
        );
        if (!isServerDown) throw primaryErr;
        setStatusLine(t("manga_status_fallback"));
        res = await runGeneration("/generate/artistic-studio", costs.artistic ?? 18, prompt, aspect);
      }
      if (!res) return;

      if (mode === "panel" && panel) {
        applyResultToPanel(panel.id, res.url);
        toast.success(t("manga_success_panel", { n: res.spent }));
        setMobileTab("config");
      } else if (mode === "page") {
        panels.forEach((p, i) => {
          if (i === 0 || p.id === activePanelId) applyResultToPanel(p.id, res.url);
        });
        toast.success(t("manga_success_page", { n: res.spent }));
      } else {
        toast.success(t("manga_success_chapter", { n: res.spent }));
      }
    } catch (e) {
      const msg = errMsg(e);
      setStatusLine(msg);
      if (activePanelId) patchPanel({ status: "error" });
      toast.error(msg, { duration: 9000 });
    } finally {
      setBusy(false);
    }
  };

  const generatePanel = () =>
    composeThenGenerate({
      mode: "panel",
      endpoint: "/generate/manga-panel",
      cost: creditCosts.mangaPanel,
      aspect: activePanel?.aspect || "4:5",
    });

  const generatePage = () =>
    composeThenGenerate({
      mode: "page",
      endpoint: "/generate/manga-page",
      cost: creditCosts.mangaPage,
      aspect: "3:4",
    });

  const generateChapter = () =>
    composeThenGenerate({
      mode: "chapter",
      endpoint: "/generate/manga-chapter",
      cost: creditCosts.mangaChapter,
      aspect: "9:16",
    });

  const runCoherence = async () => {
    setCoherenceLoading(true);
    try {
      const result = await fetchCoherenceCheck(project);
      setCoherenceResult(result);
      setCoherenceOpen(true);
      if (result.score >= 80) {
        toast.success(t("manga_coherence_good", { score: result.score }));
      } else {
        toast.message(t("manga_coherence_issues", { n: result.warnings.length }));
      }
    } finally {
      setCoherenceLoading(false);
    }
  };

  const handleNewProject = () => {
    const name = window.prompt(t("manga_project_name"), t("manga_new_project_default"));
    if (name === null) return;
    const p = createNewProject(name || undefined);
    saveSkipRef.current = true;
    setProject(p);
    setActivePanelId(p.panels[0]?.id);
    setStatusLine("");
    toast.message(t("manga_project_created"));
  };

  const handleLoadDemo = () => {
    const demo = createDemoMangaProject(t);
    saveSkipRef.current = true;
    saveProject(demo);
    setProject(demo);
    setActivePanelId(demo.panels[0]?.id);
    toast.success(t("manga_demo_loaded"));
  };

  const handleOpenProject = () => {
    const list = listProjects();
    if (!list.length) {
      toast.message(t("manga_no_saved"));
      return;
    }
    const names = list.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const pick = window.prompt(t("manga_prompt_pick_project", { names }), "1");
    const idx = Number(pick) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= list.length) return;
    const loaded = list[idx];
    saveSkipRef.current = true;
    setProject({ ...loaded });
    setActivePanelId(loaded.panels?.[0]?.id);
    saveProject(loaded);
    setStatusLine(t("manga_project_status", { name: loaded.name }));
    toast.message(t("manga_opened", { name: loaded.name }));
  };

  const onEditCharacter = (charId) => {
    setMobileTab("library");
    const c = project.characters.find((x) => x.id === charId);
    if (!c) return;
    const tag = window.prompt(t("manga_prompt_char_tag"), c.tag || c.description || "");
    if (tag === null) return;
    updateProject({
      ...project,
      characters: project.characters.map((x) =>
        x.id === charId ? { ...x, tag, description: tag } : x),
    });
  };

  const onPreviewCharacter = (charId) => {
    const c = project.characters.find((x) => x.id === charId);
    const url = c?.thumb || c?.sheets?.front;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.message(t("manga_no_image"));
  };

  return (
    <div className="manga-studio-root min-h-screen pb-28" data-testid="manga-studio-page">
      <button type="button" onClick={() => navigate("/app/tools")} className="rp-studio-back mb-6">
        <ArrowLeft className="w-4 h-4" /> {t("back_to_tools")}
      </button>

      <MangaStudioTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onFinish={() => updateProject({ ...project, tourCompleted: true })}
      />

      <CoherenceCheckPanel
        open={coherenceOpen}
        onClose={() => setCoherenceOpen(false)}
        score={coherenceResult.score}
        warnings={coherenceResult.warnings}
        onJumpToPanel={(id) => {
          setActivePanelId(id);
          setMobileTab("config");
        }}
      />

      {(statusLine || busy) && (
        <div
          className={`mb-4 flex items-start gap-2 text-sm px-3 py-2.5 rounded-lg border ${
            statusLine && !busy
              ? "text-amber-200/90 bg-amber-500/10 border-amber-500/30"
              : "text-[#C4B5FD] bg-[#9333EA]/10 border-[#A855F7]/30"
          }`}
          role="status"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{busy ? statusLine || t("manga_generating") : statusLine}</span>
        </div>
      )}

      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#9333EA]/20 border border-[rgba(147,51,234,0.35)] flex items-center justify-center text-lg">
              🎌
            </div>
            <p className="text-[#A855F7] text-[10px] font-mono uppercase tracking-[0.22em] flex items-center gap-2 flex-wrap">
              <span>Remake Pixel · {t("manga_title")}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] tracking-wider bg-emerald-500/20 text-emerald-100 border border-emerald-400/35">
                v2
              </span>
            </p>
          </div>
          <h1 className="text-white text-[26px] md:text-[34px] font-light tracking-tight font-['Inter_Tight']">
            {t("manga_subtitle")}{" "}
            <span className="italic text-[#C4B5FD]">{t("manga_subtitle_accent")}</span>
          </h1>
          <p className="text-[#9CA3AF] text-[14px] mt-2 max-w-2xl">{t("manga_desc_v2")}</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button type="button" onClick={() => setTourOpen(true)} className="manga-header-btn manga-header-btn-outline">
            <GraduationCap className="w-4 h-4" /> {t("manga_tutorial")}
          </button>
          <button type="button" onClick={handleLoadDemo} className="manga-header-btn manga-header-btn-outline">
            <Sparkle className="w-4 h-4" /> {t("manga_load_demo")}
          </button>
          <button type="button" onClick={handleNewProject} className="manga-header-btn">
            <Plus className="w-4 h-4" /> {t("manga_new_project")}
          </button>
          <button type="button" onClick={handleOpenProject} className="manga-header-btn manga-header-btn-outline">
            <FolderOpen className="w-4 h-4" /> {t("manga_open_project")}
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-3 items-center p-3 rounded-xl border border-[#2E2E30] bg-[#111118]/80">
        <span className="text-[10px] uppercase tracking-wider text-[#A855F7]">{t("manga_style_preset")}</span>
        {catalog.stylePresets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => updateProject({ ...project, stylePreset: s.id })}
            className={`px-2.5 py-1 rounded-md text-[10px] border transition-colors ${
              (project.stylePreset || "manga-classic") === s.id
                ? "border-[#A855F7] bg-[#9333EA]/25 text-white"
                : "border-[#2E2E30] text-[#9CA3AF]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center p-3 rounded-xl border border-[#2E2E30] bg-[#111118]/80">
        <span className="text-[10px] uppercase tracking-wider text-[#A855F7]">{t("manga_model_engine")}</span>
        {catalog.models.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setModelKey(m.key)}
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
        <label className="ml-auto flex items-center gap-2 text-[11px] text-[#9CA3AF] cursor-pointer">
          <input
            type="checkbox"
            checked={useGptCompose}
            onChange={(e) => setUseGptCompose(e.target.checked)}
            className="rounded border-[#2E2E30]"
          />
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          {t("manga_gpt_compose")}
        </label>
      </div>

      {!pricingReady && (
        <p className="text-[#5A5A5E] text-xs mb-3">{t("manga_loading_prices")}</p>
      )}

      <div className="flex lg:hidden gap-1 mb-4 p-1 rounded-lg bg-[#111118] border border-[rgba(147,51,234,0.2)] overflow-x-auto">
        {catalog.mobileTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 min-w-[72px] py-2 text-[10px] font-medium rounded-md transition-colors whitespace-nowrap px-1 ${
              mobileTab === tab.id ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mobileTab === "story" && (
        <div className="lg:hidden mb-4">
          <StoryNavigator
            project={project}
            activePanelId={activePanelId}
            onSelectPanel={(id) => {
              setActivePanelId(id);
              setMobileTab("config");
            }}
            onCoherenceCheck={runCoherence}
            coherenceScore={coherenceResult.score}
            coherenceLoading={coherenceLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className={`lg:col-span-3 ${mobileTab !== "library" ? "hidden lg:block" : ""}`}>
          <div className="rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#0A0A0F] p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
            <p className="px-2 py-2 text-[11px] font-mono text-[#5A5A5E] uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#A855F7]" /> {t("manga_library")}
            </p>
            <MangaLibrarySidebar project={project} onChange={updateProject} />
          </div>
        </div>

        <div className={`lg:col-span-5 ${mobileTab !== "editor" ? "hidden lg:block" : ""}`}>
          <MangaPageCanvas
            project={project}
            activePanelId={activePanelId}
            onSelectPanel={(id) => {
              setActivePanelId(id);
              setMobileTab("config");
            }}
            onChange={updateProject}
          />
        </div>

        <div className={`lg:col-span-4 ${mobileTab !== "config" ? "hidden lg:block" : ""} ${mobileTab === "story" ? "hidden" : ""}`}>
          <MangaPanelEditor
            project={project}
            panel={activePanel}
            onPatchPanel={patchPanel}
            costs={creditCosts}
            busy={busy}
            activeCharacterId={activePanel?.characterId}
            onEditCharacter={onEditCharacter}
            onPreviewCharacter={onPreviewCharacter}
            onGeneratePanel={generatePanel}
            onGeneratePage={generatePage}
            onGenerateChapter={generateChapter}
            onBackToStory={() => setMobileTab("story")}
          />
          {lastPromptPreview && (
            <details className="mt-3 rounded-lg border border-[#2E2E30] bg-[#0B0B0C]/80 p-2">
              <summary className="text-[10px] text-[#5A5A5E] cursor-pointer uppercase tracking-wider">
                {t("manga_last_prompt")}
              </summary>
              <p className="text-[10px] text-[#9CA3AF] mt-2 leading-relaxed max-h-32 overflow-y-auto">
                {lastPromptPreview}
              </p>
            </details>
          )}
        </div>
      </div>

      <div className="hidden lg:block mt-4">
        <StoryNavigator
          project={project}
          activePanelId={activePanelId}
          onSelectPanel={setActivePanelId}
          onCoherenceCheck={runCoherence}
          coherenceScore={coherenceResult.score}
          coherenceLoading={coherenceLoading}
        />
      </div>
    </div>
  );
}
