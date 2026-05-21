import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, GitBranch, LayoutGrid, Loader2, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError, pollPrediction, uploadPost } from "../lib/api";
import { useAuth } from "../lib/auth";
import { usePricing } from "../lib/PricingContext";
import { useI18n } from "../lib/i18n";
import useTitle from "../lib/useTitle";
import { composeMangaPromptApi } from "../lib/composeMangaPromptApi";
import { getMangaStudioCatalog } from "../lib/mangaStudioCatalog";
import { emptyCharacter } from "../lib/mangaStudioData";
import {
  loadActiveProject,
  saveProject,
  sanitizeMangaProject,
  createNewProject as createProject,
} from "../lib/mangaStudioStorage";
import { createDemoMangaProject } from "../lib/comic-engine/mockData";
import { fetchCoherenceCheck } from "../lib/comic-engine/coherenceCheck";
import { SetupView, AssetsView, PageView, PanelView, StoryView } from "./views";
import { Btn } from "./ui";

const COST = { panel: 15, page: 40, chapter: 150 };
const TABS = [
  { id: "assets", icon: BookOpen, labelKey: "manga_mob_assets" },
  { id: "page", icon: LayoutGrid, labelKey: "manga_mob_page" },
  { id: "panel", icon: SlidersHorizontal, labelKey: "manga_mob_panel" },
  { id: "story", icon: GitBranch, labelKey: "manga_mob_story" },
];

class StudioErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="ms-error max-w-lg mx-auto my-8">
          <h2 className="text-white text-lg font-semibold mb-2">Manga Studio</h2>
          <p className="mb-3">{String(this.state.error?.message || this.state.error)}</p>
          <button
            type="button"
            className="ms-btn ms-btn--primary"
            onClick={() => {
              try {
                localStorage.removeItem("rp_manga_projects");
                localStorage.removeItem("rp_manga_active_id");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Limpar dados e recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StudioApp() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  useTitle(t("manga_title"));

  const credits = useMemo(
    () => ({
      panel: costs.mangaPanel ?? COST.panel,
      page: costs.mangaPage ?? COST.page,
      chapter: costs.mangaChapter ?? COST.chapter,
      artistic: costs.artistic ?? 18,
    }),
    [costs],
  );

  const [boot] = useState(() => {
    const p = sanitizeMangaProject(loadActiveProject());
    return {
      project: p,
      showSetup: !p.setupComplete && !(p.characters?.length > 0),
    };
  });

  const [project, setProject] = useState(boot.project);
  const [showSetup, setShowSetup] = useState(boot.showSetup);
  const [tab, setTab] = useState("page");
  const [panelId, setPanelId] = useState(boot.project.panels?.[0]?.id ?? null);
  const [openSection, setOpenSection] = useState("character");
  const [modelKey, setModelKey] = useState("grok");
  const [useGpt, setUseGpt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [coherenceScore, setCoherenceScore] = useState(null);
  const saveSkip = useRef(true);

  const panels = useMemo(
    () => [...(project.panels || [])].sort((a, b) => a.order - b.order),
    [project.panels],
  );
  const activePanel = panels.find((p) => p.id === panelId) || null;

  useEffect(() => {
    if (!panelId && panels[0]) setPanelId(panels[0].id);
  }, [panels, panelId]);

  useEffect(() => {
    if (saveSkip.current) {
      saveSkip.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      const { warning } = saveProject(project);
      if (warning) setStatus(warning);
    }, 600);
    return () => clearTimeout(timer);
  }, [project]);

  const setProjectSafe = useCallback((next) => {
    setProject(sanitizeMangaProject(next));
  }, []);

  const patchPanel = useCallback(
    (patch) => {
      if (!panelId) return;
      setProject((prev) => ({
        ...prev,
        panels: (prev.panels || []).map((p) => (p.id === panelId ? { ...p, ...patch } : p)),
      }));
    },
    [panelId],
  );

  const patchChar = useCallback((charId, patch) => {
    setProject((prev) => ({
      ...prev,
      characters: (prev.characters || []).map((c) => (c.id === charId ? { ...c, ...patch } : c)),
    }));
  }, []);

  const patchScene = useCallback((sceneId, patch) => {
    setProject((prev) => ({
      ...prev,
      scenarios: (prev.scenarios || []).map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
    }));
  }, []);

  const runGen = async (endpoint, cost, prompt, aspect = "4:5") => {
    if (!prompt?.trim() || prompt.trim().length < 12) throw new Error(t("manga_err_prompt_short"));
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      throw new Error(t("manga_err_credits", { need: cost, have: user?.credits ?? 0 }));
    }

    const char = (project.characters || []).find((c) => c.id === activePanel?.characterId);
    let photoBlob = null;
    if (modelKey === "grok" && char?._refFile instanceof Blob) photoBlob = char._refFile;
    else if (modelKey === "grok" && char?.sheets?.front?.startsWith?.("data:")) {
      try {
        const res = await fetch(char.sheets.front);
        photoBlob = await res.blob();
      } catch {
        /* ok */
      }
    }

    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let data;
    if (photoBlob?.size > 0 && photoBlob.size < 3_500_000) {
      const fd = new FormData();
      fd.append("prompt_final", prompt.trim());
      fd.append("aspect_ratio", aspect);
      fd.append("model_key", modelKey);
      fd.append("photo", photoBlob, "ref.png");
      ({ data } = await uploadPost(path, fd, { timeout: 120000, headers: { "X-Skip-Auto-Poll": "1" } }));
    } else {
      ({ data } = await api.post(
        path,
        { prompt_final: prompt.trim(), aspect_ratio: aspect, model_key: modelKey },
        { timeout: 90000, headers: { "X-Skip-Auto-Poll": "1" } },
      ));
    }

    if (!data?.prediction_id) {
      const url = data?.creation?.result_urls?.[0];
      if (url) {
        await refresh();
        return { url, spent: data?.credits_spent ?? cost };
      }
      throw new Error(data?.detail || t("manga_err_no_prediction"));
    }

    const polled = await pollPrediction(data.prediction_id, {
      credits_spent: data.credits_spent ?? cost,
      type: "manga",
      timeoutMs: 300000,
    });
    const url = polled?.creation?.result_urls?.[0];
    if (!url) throw new Error(t("manga_err_no_url"));
    await refresh();
    return { url, spent: polled?.creation?.credits_spent ?? cost };
  };

  const generate = async (mode) => {
    if (mode === "panel" && !activePanel) {
      toast.error(t("manga_select_panel_toast"));
      return;
    }
    const char = (project.characters || []).find((c) => c.id === activePanel?.characterId);
    const scene = (project.scenarios || []).find((s) => s.id === activePanel?.scenarioId);
    const endpoints = { panel: "/generate/manga-panel", page: "/generate/manga-page", chapter: "/generate/manga-chapter" };
    const costMap = { panel: credits.panel, page: credits.page, chapter: credits.chapter };

    setBusy(true);
    setStatus(t("manga_status_compose"));
    try {
      const { prompt } = await composeMangaPromptApi({
        mode,
        panel: activePanel,
        panels,
        project,
        character: char,
        scenario: scene,
        lang: lang || "pt",
        useGpt,
      });
      if (mode === "panel") patchPanel({ status: "generating" });
      const res = await runGen(endpoints[mode], costMap[mode], prompt, activePanel?.aspect || "4:5");
      if (mode === "panel" && activePanel) {
        setProject((prev) => ({
          ...prev,
          panels: prev.panels.map((p) =>
            p.id === activePanel.id ? { ...p, resultUrl: res.url, status: "completed" } : p),
        }));
        toast.success(t("manga_success_panel", { n: res.spent }));
      } else {
        toast.success(mode === "page" ? t("manga_success_page", { n: res.spent }) : t("manga_success_chapter", { n: res.spent }));
      }
      setStatus("");
    } catch (e) {
      const msg = formatApiError(e, t("manga_fail"));
      setStatus(msg);
      toast.error(msg);
      if (activePanel) patchPanel({ status: "error" });
    } finally {
      setBusy(false);
    }
  };

  const finishSetup = () => {
    const next = { ...project, setupComplete: true };
    setProjectSafe(next);
    saveProject(next);
    setShowSetup(false);
    setTab("page");
  };

  const loadDemo = () => {
    const demo = { ...createDemoMangaProject(t), setupComplete: true };
    saveSkip.current = true;
    saveProject(demo);
    setProjectSafe(demo);
    setPanelId(demo.panels[0]?.id);
    setShowSetup(false);
    setTab("page");
    toast.success(t("manga_demo_loaded"));
  };

  const newProject = () => {
    const name = window.prompt(t("manga_project_name"), t("manga_new_project_default"));
    if (name === null) return;
    const p = createProject(name || undefined);
    saveSkip.current = true;
    saveProject(p);
    setProjectSafe(p);
    setPanelId(p.panels[0]?.id);
    setShowSetup(true);
    setTab("assets");
  };

  const selectPanel = (id) => {
    setPanelId(id);
    setTab("panel");
  };

  const toggleSection = (id) => setOpenSection((s) => (s === id ? "" : id));

  const renderView = () => {
    if (showSetup) {
      return (
        <SetupView
          t={t}
          catalog={catalog}
          project={project}
          modelKey={modelKey}
          useGpt={useGpt}
          onChange={setProjectSafe}
          onModel={setModelKey}
          onGpt={setUseGpt}
          onAddChar={() => {
            const name = window.prompt(t("manga_prompt_char_name"), t("manga_default_char"));
            if (!name?.trim()) return;
            setProjectSafe({
              ...project,
              characters: [...(project.characters || []), emptyCharacter(name.trim())],
            });
          }}
          onStart={finishSetup}
          onDemo={loadDemo}
        />
      );
    }

    const props = { t, catalog, project, onChange: setProjectSafe };

    if (tab === "assets") return <AssetsView {...props} />;
    if (tab === "page") {
      return (
        <PageView
          {...props}
          activePanelId={panelId}
          onSelectPanel={selectPanel}
          onGeneratePage={() => generate("page")}
          busy={busy}
          cost={credits.page}
        />
      );
    }
    if (tab === "panel") {
      return (
        <PanelView
          {...props}
          panel={activePanel}
          onPatch={patchPanel}
          onPatchChar={patchChar}
          onPatchScene={patchScene}
          openSection={openSection}
          onToggleSection={toggleSection}
        />
      );
    }
    return (
      <StoryView
        t={t}
        project={project}
        activePanelId={panelId}
        onSelectPanel={selectPanel}
        coherenceScore={coherenceScore}
        loading={busy}
        onCoherence={async () => {
          setBusy(true);
          try {
            const r = await fetchCoherenceCheck(project);
            setCoherenceScore(r.score);
            toast.message(t("manga_coherence_issues", { n: r.warnings?.length ?? 0 }));
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  };

  return (
    <StudioErrorBoundary>
      <div className="ms-root" data-testid="manga-studio-page">
        <header className="ms-top">
          <div className="ms-top-row">
            <button type="button" className="ms-back" onClick={() => navigate("/app/tools")} aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="ms-title">
              <h1>{t("manga_subtitle")} {t("manga_subtitle_accent")}</h1>
              <p>{project.name}</p>
            </div>
            <span className="ms-badge">v3</span>
          </div>
          <div className="ms-toolbar">
            <Btn onClick={loadDemo}>{t("manga_load_demo")}</Btn>
            <Btn onClick={newProject}>{t("manga_new_project")}</Btn>
            {!showSetup && (
              <Btn variant="warn" onClick={() => generate("panel")} disabled={busy || !activePanel}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t("manga_gen_panel_short", { n: credits.panel })}
              </Btn>
            )}
          </div>
          {status && <div className="ms-status" role="status">{status}</div>}
        </header>

        <div className="ms-body">{renderView()}</div>

        {!showSetup && tab === "panel" && activePanel && (
          <div className="ms-dock ms-dock--mobile">
            <Btn variant="primary" className="w-full" disabled={busy} onClick={() => generate("panel")}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("manga_gen_panel_short", { n: credits.panel })}
            </Btn>
            <div className="ms-chips">
              <Btn className="flex-1" disabled={busy} onClick={() => generate("page")}>
                {t("manga_gen_page_short", { n: credits.page })}
              </Btn>
              <Btn className="flex-1" disabled={busy} onClick={() => generate("chapter")}>
                {t("manga_gen_chapter_short", { n: credits.chapter })}
              </Btn>
            </div>
          </div>
        )}

        {!showSetup && (
          <nav className="ms-nav" aria-label={t("manga_mobile_nav")}>
            {TABS.map(({ id, icon: Icon, labelKey }) => (
              <button
                key={id}
                type="button"
                className={`ms-nav-item ${tab === id ? "ms-nav-item--on" : ""}`}
                onClick={() => setTab(id)}
              >
                <Icon className="w-5 h-5" strokeWidth={tab === id ? 2.25 : 1.75} />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </StudioErrorBoundary>
  );
}
