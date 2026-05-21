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
import MangaAssetLibrary from "../../components/manga/MangaAssetLibrary";
import MangaPageCanvas from "../../components/manga/MangaPageCanvas";
import MangaPanelEditor from "../../components/manga/MangaPanelEditor";
import StoryNavigator from "../../components/manga/StoryNavigator";
import CoherenceCheckPanel from "../../components/manga/CoherenceCheckPanel";
import MangaStudioTour, { isTourDone } from "../../components/manga/MangaStudioTour";
import MangaStudioHeader from "../../components/manga/MangaStudioHeader";
import MangaStudioMobileNav from "../../components/manga/MangaStudioMobileNav";
import MangaProjectWizard, { promptNewCharacter } from "../../components/manga/MangaProjectWizard";
import { Save, RefreshCw } from "lucide-react";

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
  const [showWizard, setShowWizard] = useState(
    () => !loadActiveProject().setupComplete && !(loadActiveProject().characters?.length > 0),
  );
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

  const patchCharacter = useCallback((charId, patch) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === charId ? { ...c, ...patch } : c)),
    }));
  }, []);

  const patchScenario = useCallback((scenarioId, patch) => {
    setProject((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => (s.id === scenarioId ? { ...s, ...patch } : s)),
    }));
  }, []);

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
    const p = { ...createNewProject(name || undefined), setupComplete: false };
    saveSkipRef.current = true;
    saveProject(p);
    setProject(p);
    setActivePanelId(p.panels[0]?.id);
    setStatusLine("");
    setShowWizard(true);
    setMobileTab("library");
    toast.message(t("manga_project_created"));
  };

  const handleLoadDemo = () => {
    const demo = { ...createDemoMangaProject(t), setupComplete: true };
    saveSkipRef.current = true;
    saveProject(demo);
    setProject(demo);
    setActivePanelId(demo.panels[0]?.id);
    setShowWizard(false);
    setMobileTab("editor");
    toast.success(t("manga_demo_loaded"));
  };

  const handleWizardAddChar = () => {
    const c = promptNewCharacter(t);
    if (!c) return;
    updateProject({ ...project, characters: [...(project.characters || []), c] });
  };

  const handleWizardImportChar = (char) => {
    updateProject({ ...project, characters: [...(project.characters || []), char] });
    toast.success(t("manga_char_imported", { name: char.name }));
  };

  const finishWizard = () => {
    const next = { ...project, setupComplete: true };
    setProject(next);
    saveProject(next);
    setShowWizard(false);
    setMobileTab("editor");
  };

  const saveDraft = () => {
    const { warning } = saveProject(project);
    if (warning) setStatusLine(warning);
    else toast.success(t("manga_save_draft_ok"));
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

  const renderTabContent = () => {
    if (mobileTab === "library") {
      return <MangaAssetLibrary project={project} onChange={updateProject} />;
    }
    if (mobileTab === "editor") {
      return (
        <MangaPageCanvas
          project={project}
          activePanelId={activePanelId}
          onSelectPanel={selectPanel}
          onChange={updateProject}
          onGeneratePage={generatePage}
          pageGenCost={creditCosts.mangaPage}
          busy={busy}
        />
      );
    }
    if (mobileTab === "config") {
      return (
        <MangaPanelEditor
          project={project}
          panel={activePanel}
          panelIndex={activePanelIndex >= 0 ? activePanelIndex : 0}
          panelTotal={sortedPanels.length}
          onPatchPanel={patchPanel}
          onPatchCharacter={patchCharacter}
          onPatchScenario={patchScenario}
          costs={creditCosts}
          busy={busy}
          activeCharacterId={activePanel?.characterId}
          onEditCharacter={onEditCharacter}
          onPreviewCharacter={onPreviewCharacter}
          onGeneratePanel={generatePanel}
          onGeneratePage={generatePage}
          onGenerateChapter={generateChapter}
          onBackToEditor={() => setMobileTab("editor")}
          onSaveDraft={saveDraft}
          hideGenerateActions
        />
      );
    }
    return (
      <StoryNavigator
        project={project}
        activePanelId={activePanelId}
        onSelectPanel={selectPanel}
        onCoherenceCheck={runCoherence}
        coherenceScore={coherenceResult.score}
        coherenceLoading={coherenceLoading}
      />
    );
  };

  return (
    <div className="manga-studio-page" data-testid="manga-studio-page">
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

      <div className="manga-shell-subheader">
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
            className={`manga-status-banner ${statusLine && !busy ? "manga-status-banner--warn" : ""}`}
            role="status"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{busy ? statusLine || t("manga_generating") : statusLine}</span>
          </div>
        )}
      </div>

      <main className="manga-shell-main">
        {showWizard ? (
          <MangaProjectWizard
            t={t}
            catalog={catalog}
            stylePreset={project.stylePreset || "manga-classic"}
            modelKey={modelKey}
            useGptCompose={useGptCompose}
            characters={project.characters || []}
            onStyleChange={(id) => updateProject({ ...project, stylePreset: id })}
            onModelChange={setModelKey}
            onGptComposeChange={setUseGptCompose}
            onAddCharacter={handleWizardAddChar}
            onImportCharacter={handleWizardImportChar}
            onStart={finishWizard}
          />
        ) : (
          <>
            <div className="manga-desktop-layout hidden lg:grid">
              <aside className="manga-desktop-col">
                <MangaAssetLibrary project={project} onChange={updateProject} />
              </aside>
              <section className="manga-desktop-col">
                <MangaPageCanvas
                  project={project}
                  activePanelId={activePanelId}
                  onSelectPanel={selectPanel}
                  onChange={updateProject}
                  onGeneratePage={generatePage}
                  pageGenCost={creditCosts.mangaPage}
                  busy={busy}
                />
              </section>
              <section className="manga-desktop-col manga-desktop-col--panel">
                <MangaPanelEditor
                  project={project}
                  panel={activePanel}
                  panelIndex={activePanelIndex >= 0 ? activePanelIndex : 0}
                  panelTotal={sortedPanels.length}
                  onPatchPanel={patchPanel}
                  onPatchCharacter={patchCharacter}
                  onPatchScenario={patchScenario}
                  splitLayout
                  costs={creditCosts}
                  busy={busy}
                  activeCharacterId={activePanel?.characterId}
                  onEditCharacter={onEditCharacter}
                  onPreviewCharacter={onPreviewCharacter}
                  onGeneratePanel={generatePanel}
                  onGeneratePage={generatePage}
                  onGenerateChapter={generateChapter}
                  onSaveDraft={saveDraft}
                />
              </section>
              <div className="manga-desktop-story lg:col-span-3">
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
            <div className="manga-mobile-pane lg:hidden">{renderTabContent()}</div>
          </>
        )}
      </main>

      {!showWizard && mobileTab === "config" && activePanel && (
        <div className="manga-shell-actions lg:hidden">
          <button type="button" disabled={busy} onClick={generatePanel} className="manga-cta-btn min-h-[56px] w-full">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t("manga_gen_panel_short", { n: creditCosts.mangaPanel })}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={generatePage} className="manga-secondary-cta min-h-[48px]">
              {t("manga_gen_page_short", { n: creditCosts.mangaPage })}
            </button>
            <button type="button" disabled={busy} onClick={generateChapter} className="manga-secondary-cta min-h-[48px]">
              {t("manga_gen_chapter_short", { n: creditCosts.mangaChapter })}
            </button>
          </div>
          <button type="button" className="manga-chip-btn w-full min-h-[44px] justify-center" onClick={saveDraft}>
            <Save className="w-4 h-4" /> {t("manga_save_draft")}
          </button>
        </div>
      )}

      {!showWizard && (
        <MangaStudioMobileNav
          active={mobileTab}
          onChange={setMobileTab}
          t={t}
          panelIndex={activePanelIndex >= 0 ? activePanelIndex : 0}
          panelTotal={sortedPanels.length}
        />
      )}
    </div>
  );
}
