import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
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
import MangaStudioHeader from "../../components/manga/MangaStudioHeader";
import MangaStudioSettingsPanel from "../../components/manga/MangaStudioSettingsPanel";
import MangaStudioMobileNav from "../../components/manga/MangaStudioMobileNav";
import MangaMobileGenerateDock from "../../components/manga/MangaMobileGenerateDock";

const CREDIT_DEFAULTS = { mangaPanel: 15, mangaPage: 40, mangaChapter: 150 };

export default function MangaStudio() {
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

  const sortedPanels = useMemo(
    () => [...(project.panels || [])].sort((a, b) => a.order - b.order),
    [project.panels],
  );

  const activePanelIndex = useMemo(
    () => sortedPanels.findIndex((p) => p.id === activePanelId),
    [sortedPanels, activePanelId],
  );

  useEffect(() => {
    if (!isTourDone() && !project.tourCompleted) {
      const timer = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [project.tourCompleted]);

  useEffect(() => {
    if (!activePanelId && sortedPanels.length) {
      setActivePanelId(sortedPanels[0].id);
    }
  }, [sortedPanels, activePanelId]);

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
        /* ok */
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
    const panels = panelsOverride || sortedPanels;

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
      if (source === "gpt") toast.message(t("manga_prompt_gpt_toast"));

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
    setMobileTab("editor");
    toast.message(t("manga_project_created"));
  };

  const handleLoadDemo = () => {
    const demo = createDemoMangaProject(t);
    saveSkipRef.current = true;
    saveProject(demo);
    setProject(demo);
    setActivePanelId(demo.panels[0]?.id);
    setMobileTab("editor");
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
    setMobileTab("editor");
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

  const selectPanel = (id) => {
    setActivePanelId(id);
    setMobileTab("config");
  };

  return (
    <div className="manga-studio-root manga-studio-root--mobile" data-testid="manga-studio-page">
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
        onJumpToPanel={(id) => selectPanel(id)}
      />

      <MangaStudioHeader
        t={t}
        projectName={project.name}
        onTutorial={() => setTourOpen(true)}
        onDemo={handleLoadDemo}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        coherenceScore={coherenceResult.score}
        onCoherence={runCoherence}
      />

      {(statusLine || busy) && (
        <div
          className={`manga-status-banner mb-3 ${
            statusLine && !busy ? "manga-status-banner--warn" : ""
          }`}
          role="status"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-[12px] leading-snug">
            {busy ? statusLine || t("manga_generating") : statusLine}
          </span>
        </div>
      )}

      <MangaStudioSettingsPanel
        t={t}
        catalog={catalog}
        project={project}
        modelKey={modelKey}
        useGptCompose={useGptCompose}
        onStyleChange={(id) => updateProject({ ...project, stylePreset: id })}
        onModelChange={setModelKey}
        onGptComposeChange={setUseGptCompose}
      />

      {!pricingReady && (
        <p className="text-[#5A5A5E] text-xs mb-2">{t("manga_loading_prices")}</p>
      )}

      <div className="manga-workspace grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5">
        <div className={`manga-pane manga-pane--library lg:col-span-3 ${mobileTab !== "library" ? "manga-pane--hidden-mobile" : ""}`}>
          <div className="manga-pane-card manga-pane-card--library">
            <MangaLibrarySidebar project={project} onChange={updateProject} />
          </div>
        </div>

        <div className={`manga-pane manga-pane--editor lg:col-span-5 ${mobileTab !== "editor" ? "manga-pane--hidden-mobile" : ""}`}>
          <MangaPageCanvas
            project={project}
            activePanelId={activePanelId}
            onSelectPanel={selectPanel}
            onChange={updateProject}
          />
        </div>

        <div className={`manga-pane manga-pane--config lg:col-span-4 ${mobileTab !== "config" ? "manga-pane--hidden-mobile" : ""}`}>
          <MangaPanelEditor
            project={project}
            panel={activePanel}
            panelIndex={activePanelIndex >= 0 ? activePanelIndex : 0}
            panelTotal={sortedPanels.length}
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
            hideGenerateActions
          />
          {lastPromptPreview && (
            <details className="mt-2 rounded-lg border border-[#2E2E30] bg-[#0B0B0C]/80 p-2 hidden sm:block">
              <summary className="text-[10px] text-[#5A5A5E] cursor-pointer uppercase tracking-wider">
                {t("manga_last_prompt")}
              </summary>
              <p className="text-[10px] text-[#9CA3AF] mt-2 leading-relaxed max-h-24 overflow-y-auto">
                {lastPromptPreview}
              </p>
            </details>
          )}
        </div>

        <div className={`manga-pane manga-pane--story lg:col-span-12 ${mobileTab !== "story" ? "manga-pane--hidden-mobile" : ""}`}>
          <StoryNavigator
            project={project}
            activePanelId={activePanelId}
            onSelectPanel={selectPanel}
            onCoherenceCheck={runCoherence}
            coherenceScore={coherenceResult.score}
            coherenceLoading={coherenceLoading}
          />
        </div>
      </div>

      {mobileTab === "config" && activePanel && (
        <MangaMobileGenerateDock
          t={t}
          busy={busy}
          costs={creditCosts}
          onGeneratePanel={generatePanel}
          onGeneratePage={generatePage}
          onGenerateChapter={generateChapter}
        />
      )}

      <MangaStudioMobileNav
        active={mobileTab}
        onChange={setMobileTab}
        t={t}
        panelIndex={activePanelIndex >= 0 ? activePanelIndex : 0}
        panelTotal={sortedPanels.length}
      />
    </div>
  );
}
