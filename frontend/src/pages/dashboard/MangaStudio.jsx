import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, FolderOpen, Loader2, Plus, AlertCircle,
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
import useTitle from "../../lib/useTitle";
import { toast } from "sonner";
import { buildMangaInteractionPrompt } from "../../lib/mangaCharacterInteractions";
import {
  characterHasReference,
  getCharacterPhotoBlob,
} from "../../lib/mangaCharacterRef";
import { mangaApiAspect } from "../../lib/mangaApiAspect";
import {
  draftToEditorScenePatch,
  editorSceneToPanelPatch,
  emptyEditorScene,
  mergeEditorScene,
  panelToEditorScene,
} from "../../lib/mangaEditorSync";
import { defaultInteractionConfig } from "../../lib/mangaCharacterInteractions";
import { isEditorDirty, validatePanelGenerate } from "../../lib/mangaStudioReady";
import MangaLibrarySidebar from "../../components/manga/MangaLibrarySidebar";
import MangaPageCanvas from "../../components/manga/MangaPageCanvas";
import MangaSceneEditor from "../../components/manga/MangaSceneEditor";
import MangaPanelRender from "../../components/manga/MangaPanelRender";
import MangaWorkflowBar from "../../components/manga/MangaWorkflowBar";

const CREDIT_DEFAULTS = { mangaPanel: 15, mangaPage: 40, mangaChapter: 150 };

export default function MangaStudio() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const errMsg = (err) => formatApiError(err, t("manga_fail"), { context: "image_upload", t });
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

  const [project, setProject] = useState(() => {
    const p = loadActiveProject();
    const first = p.panels?.[0];
    return {
      ...p,
      editorScene: p.editorScene || (first ? panelToEditorScene(first) : emptyEditorScene()),
    };
  });
  const [activePanelId, setActivePanelId] = useState(null);
  const [mobileTab, setMobileTab] = useState("editor");
  const lastLoadedPanelRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [modelKey, setModelKey] = useState("grok");
  const [useGptCompose, setUseGptCompose] = useState(false);
  const [lastPromptPreview, setLastPromptPreview] = useState("");
  const saveSkipRef = useRef(true);

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

  const editorScene = project.editorScene || emptyEditorScene();
  const syncDirty = isEditorDirty(activePanel, editorScene);

  const readiness = useMemo(
    () => validatePanelGenerate({ panel: activePanel, editorScene, project, t }),
    [activePanel, editorScene, project, t],
  );

  const libraryOk = (project.characters || []).some(characterHasReference);
  const editorOk = Boolean(editorScene.characterId && libraryOk);
  const panelOk = readiness.ok;

  useEffect(() => {
    if (!activePanelId || !activePanel) return;
    if (lastLoadedPanelRef.current === activePanelId) return;
    lastLoadedPanelRef.current = activePanelId;
    setProject((prev) => ({
      ...prev,
      editorScene: panelToEditorScene(activePanel),
    }));
  }, [activePanelId, activePanel]);

  const updateProject = useCallback((next) => {
    setProject(next);
  }, []);

  const updateEditorScene = useCallback((nextScene) => {
    setProject((prev) => ({ ...prev, editorScene: nextScene }));
  }, []);

  const syncEditorToActivePanel = useCallback(() => {
    if (!activePanelId) {
      toast.error(t("manga_select_panel_toast"));
      return null;
    }
    const patch = editorSceneToPanelPatch(editorScene);
    setProject((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === activePanelId ? { ...p, ...patch } : p)),
    }));
    return { ...activePanel, ...patch };
  }, [activePanelId, activePanel, editorScene, t]);

  const applyResultToPanel = (panelId, url) => {
    setProject((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === panelId ? { ...p, resultUrl: url } : p)),
    }));
  };

  const resolveModelKey = () => modelKey;

  const runGeneration = async (endpoint, cost, prompt, aspect = "3:4", refCharacter = null) => {
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
    const char =
      refCharacter ||
      (project.characters || []).find((c) => c.id === activePanel?.characterId);
    let photoBlob = null;
    if (effectiveModel === "grok" && char) {
      photoBlob = await getCharacterPhotoBlob(char);
    }

    setStatusLine(t("manga_status_start"));
    let submitData;

    if (photoBlob && photoBlob.size > 0 && photoBlob.size < 3_500_000) {
      const fd = new FormData();
      fd.append("prompt_final", prompt.trim());
      fd.append("aspect_ratio", mangaApiAspect(aspect));
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
          aspect_ratio: mangaApiAspect(aspect),
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
        setMobileTab("editor");
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
      toast.error(msg, { duration: 9000 });
    } finally {
      setBusy(false);
    }
  };

  const generateInteractionPanel = async (panelSnapshot) => {
    const charA = project.characters?.find((c) => c.id === panelSnapshot?.characterId);
    const charB = project.characters?.find((c) => c.id === panelSnapshot?.partnerCharacterId);
    const ix = panelSnapshot?.interaction || editorScene.interaction;
    if (!charA?.id || !charB?.id) {
      toast.error(t("manga_ix_need_two"));
      return;
    }
    if (!characterHasReference(charA) || !characterHasReference(charB)) {
      toast.error(t("manga_ix_need_refs"), { duration: 9000 });
      return;
    }
    const typeMeta = { label: t(`manga_ix_type_${ix.interactionType}`) };
    const prompt = buildMangaInteractionPrompt({
      charA,
      charB,
      config: { ...ix, interactionLabel: typeMeta.label },
    });
    const cost = creditCosts.mangaPanel;
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("manga_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setLastPromptPreview(prompt);
    setStatusLine(t("manga_ix_compose_qwen"));
    try {
      const blobA = await getCharacterPhotoBlob(charA);
      const blobB = await getCharacterPhotoBlob(charB);
      if (!blobA?.size || !blobB?.size) {
        toast.error(t("manga_ix_need_refs"));
        return;
      }
      const fd = new FormData();
      fd.append("prompt_final", prompt.trim());
      fd.append("aspect_ratio", mangaApiAspect(panelSnapshot?.aspect || "3:4"));
      fd.append("photo", blobA, `${charA.name}-ref.png`);
      fd.append("photo_b", blobB, `${charB.name}-ref.png`);

      setStatusLine(t("manga_status_start"));
      const { data: submitData } = await uploadPost("/generate/manga-interaction", fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      });

      let res;
      if (!submitData?.prediction_id) {
        const direct = submitData?.creation?.result_urls?.[0];
        if (!direct) throw new Error(submitData?.detail || t("manga_err_no_prediction"));
        await refresh();
        res = { url: direct, spent: submitData?.credits_spent ?? cost };
      } else {
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
        res = {
          url,
          spent: polled?.creation?.credits_spent ?? submitData.credits_spent ?? cost,
        };
      }
      if (res?.url && panelSnapshot?.id) {
        applyResultToPanel(panelSnapshot.id, res.url);
        toast.success(t("manga_success_panel", { n: res.spent }));
        setMobileTab("editor");
      }
    } catch (e) {
      const msg = errMsg(e);
      setStatusLine(msg);
      toast.error(msg, { duration: 9000 });
    } finally {
      setBusy(false);
      setStatusLine("");
    }
  };

  const generatePanel = async () => {
    if (!readiness.ok) {
      toast.error(readiness.issues[0]?.text || t("manga_ready_no_char"), { duration: 8000 });
      if (!editorScene.characterId) setMobileTab("editor");
      else if (!libraryOk) setMobileTab("library");
      return;
    }
    const synced = syncEditorToActivePanel();
    if (!synced) return;
    if (editorScene.duoMode && editorScene.partnerCharacterId) {
      await generateInteractionPanel(synced);
      return;
    }
    await composeThenGenerate({
      mode: "panel",
      endpoint: "/generate/manga-panel",
      cost: creditCosts.mangaPanel,
      aspect: mangaApiAspect(synced.aspect || "3:4"),
      panelOverride: synced,
    });
  };

  const generatePage = async () => {
    if (!readiness.ok) {
      toast.error(readiness.issues[0]?.text || t("manga_ready_no_char"), { duration: 8000 });
      return;
    }
    const synced = syncEditorToActivePanel();
    if (!synced) return;
    await composeThenGenerate({
      mode: "page",
      endpoint: "/generate/manga-page",
      cost: creditCosts.mangaPage,
      aspect: "3:4",
      panelOverride: synced,
    });
  };

  const generateChapter = async () => {
    if (!readiness.ok) {
      toast.error(readiness.issues[0]?.text || t("manga_ready_no_char"), { duration: 8000 });
      return;
    }
    const synced = syncEditorToActivePanel();
    if (!synced) return;
    await composeThenGenerate({
      mode: "chapter",
      endpoint: "/generate/manga-chapter",
      cost: creditCosts.mangaChapter,
      aspect: "9:16",
      panelOverride: synced,
    });
  };

  const applyInteractionPresetToEditor = useCallback(
    ({ characterId, preset }) => {
      if (!preset) return;
      const cfg = { ...defaultInteractionConfig(preset.partnerId), ...(preset.config || {}) };
      setProject((prev) => {
        const { editorScene, panels } = mergeEditorScene(
          prev,
          {
            characterId,
            duoMode: true,
            partnerCharacterId: preset.partnerId,
            interaction: cfg,
          },
          activePanelId,
        );
        return { ...prev, editorScene, panels };
      });
      lastLoadedPanelRef.current = activePanelId;
      setMobileTab("editor");
      toast.success(t("manga_preset_loaded_panel"));
    },
    [activePanelId, t],
  );

  const applyCompositionToEditor = useCallback(
    ({ composition }) => {
      const draft = composition?.draft;
      if (!draft) return;
      setProject((prev) => {
        const { editorScene, panels } = mergeEditorScene(
          prev,
          draftToEditorScenePatch(draft, prev.editorScene || emptyEditorScene()),
          activePanelId,
        );
        return { ...prev, editorScene, panels };
      });
      lastLoadedPanelRef.current = activePanelId;
      setMobileTab("editor");
      toast.success(t("manga_comp_loaded_panel"));
    },
    [activePanelId, t],
  );

  const confirmEditorAndOpenPanel = useCallback(() => {
    const synced = syncEditorToActivePanel();
    if (!synced) return;
    lastLoadedPanelRef.current = activePanelId;
    setMobileTab("config");
    toast.message(t("manga_editor_confirm_toast"));
  }, [activePanelId, syncEditorToActivePanel, t]);

  const handleNewProject = () => {
    const name = window.prompt(t("manga_project_name"), t("manga_new_project_default"));
    if (name === null) return;
    const p = createNewProject(name || undefined);
    const first = p.panels[0];
    saveSkipRef.current = true;
    setProject({
      ...p,
      editorScene: first ? panelToEditorScene(first) : emptyEditorScene(),
    });
    lastLoadedPanelRef.current = null;
    setActivePanelId(first?.id);
    setStatusLine("");
    toast.message(t("manga_project_created"));
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
    const first = loaded.panels?.[0];
    lastLoadedPanelRef.current = null;
    setProject({
      ...loaded,
      editorScene: loaded.editorScene || (first ? panelToEditorScene(first) : emptyEditorScene()),
    });
    setActivePanelId(first?.id);
    saveProject(loaded);
    setStatusLine(t("manga_project_status", { name: loaded.name }));
    toast.message(t("manga_opened", { name: loaded.name }));
  };

  const onPreviewCharacter = (charId) => {
    const c = project.characters.find((x) => x.id === charId);
    const url = c?.thumb || c?.sheets?.front;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.message(t("manga_no_image"));
  };

  return (
    <div className="manga-studio-root w-full max-w-[1600px] mx-auto pb-8 md:pb-12" data-testid="manga-studio-page">
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
              <span className="px-2 py-0.5 rounded-full text-[9px] tracking-wider bg-amber-500/20 text-amber-100 border border-amber-400/35">
                {t("badge_beta")}
              </span>
            </p>
          </div>
          <h1 className="text-white text-[26px] md:text-[34px] font-light tracking-tight font-['Inter_Tight']">
            {t("manga_subtitle")}{" "}
            <span className="italic text-[#C4B5FD]">{t("manga_subtitle_accent")}</span>
          </h1>
          <p className="text-[#9CA3AF] text-[14px] mt-2 max-w-2xl">{t("manga_desc")}</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button type="button" onClick={handleNewProject} className="manga-header-btn">
            <Plus className="w-4 h-4" /> {t("manga_new_project")}
          </button>
          <button type="button" onClick={handleOpenProject} className="manga-header-btn manga-header-btn-outline">
            <FolderOpen className="w-4 h-4" /> {t("manga_open_project")}
          </button>
        </div>
      </header>

      <MangaWorkflowBar
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        libraryOk={libraryOk}
        editorOk={editorOk}
        panelOk={panelOk}
        dirty={syncDirty}
      />

      {!pricingReady && (
        <p className="text-[#5A5A5E] text-xs mb-3">{t("manga_loading_prices")}</p>
      )}

      <div className="flex lg:hidden gap-1 mb-4 p-1 rounded-lg bg-[#111118] border border-[rgba(147,51,234,0.2)]">
        {catalog.mobileTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-2 text-[11px] font-medium rounded-md transition-colors ${
              mobileTab === tab.id ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className={`lg:col-span-3 ${mobileTab !== "library" ? "hidden lg:block" : ""}`}>
          <div className="rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#0A0A0F] p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
            <p className="px-2 py-2 text-[11px] font-mono text-[#5A5A5E] uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#A855F7]" /> {t("manga_library")}
            </p>
            <MangaLibrarySidebar
              project={project}
              onChange={updateProject}
              onSaveSceneComposition={() => toast.message(t("manga_scn_comp_saved"))}
              onUsePresetInEditor={applyInteractionPresetToEditor}
              onUseCompositionInEditor={applyCompositionToEditor}
            />
          </div>
        </div>

        <div className={`lg:col-span-5 space-y-4 ${mobileTab !== "editor" ? "hidden lg:block" : ""}`}>
          <MangaPageCanvas
            project={project}
            activePanelId={activePanelId}
            onSelectPanel={(id) => {
              lastLoadedPanelRef.current = null;
              setActivePanelId(id);
              setMobileTab("editor");
            }}
            onChange={updateProject}
          />
          <MangaSceneEditor
            project={project}
            editorScene={editorScene}
            activePanelId={activePanelId}
            onChangeEditorScene={updateEditorScene}
            syncDirty={syncDirty}
            onApplyToProject={(partial) => {
              setProject((prev) => {
                const { editorScene: nextScene, panels } = mergeEditorScene(
                  prev,
                  partial,
                  activePanelId,
                );
                return { ...prev, editorScene: nextScene, panels };
              });
              lastLoadedPanelRef.current = activePanelId;
            }}
            onConfirmAndOpenPanel={confirmEditorAndOpenPanel}
            onPreviewCharacter={onPreviewCharacter}
          />
        </div>

        <div className={`lg:col-span-4 ${mobileTab !== "config" ? "hidden lg:block" : ""}`}>
          <MangaPanelRender
            panel={activePanel}
            editorScene={editorScene}
            readiness={readiness}
            costs={creditCosts}
            user={user}
            busy={busy}
            modelKey={modelKey}
            onModelKeyChange={setModelKey}
            useGptCompose={useGptCompose}
            onUseGptComposeChange={setUseGptCompose}
            onGeneratePanel={generatePanel}
            onGeneratePage={generatePage}
            onGenerateChapter={generateChapter}
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
    </div>
  );
}