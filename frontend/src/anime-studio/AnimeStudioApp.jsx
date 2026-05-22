import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { usePricing } from "../lib/PricingContext";
import { useI18n } from "../lib/i18n";
import useTitle from "../lib/useTitle";
import { api, formatApiError, pollPrediction } from "../lib/api";
import { composeMangaPromptApi } from "../lib/composeMangaPromptApi";
import { calcGenerationCost } from "./types";
import { buildFlowPrompt, orderNodesByFlow } from "./buildFlowPrompt";
import { useFlowStore } from "./useFlowStore";
import StudioToolbar from "./StudioToolbar";
import StudioWorkspace from "./StudioWorkspace";

import "./anime-studio.css";
import "@xyflow/react/dist/style.css";

export default function AnimeStudioApp() {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();
  useTitle(t("manga_title"));

  const [busy, setBusy] = useState(false);

  const projectName = useFlowStore((s) => s.projectName);
  const setProjectName = useFlowStore((s) => s.setProjectName);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const status = useFlowStore((s) => s.status);
  const setStatus = useFlowStore((s) => s.setStatus);
  const getResolvedOutputMode = useFlowStore((s) => s.getResolvedOutputMode);
  const story = useFlowStore((s) => s.story);
  const setEdgesGenerating = useFlowStore((s) => s.setEdgesGenerating);

  const genCost = useMemo(() => {
    const mode = getResolvedOutputMode();
    const map = {
      panel: costs.mangaPanel ?? 15,
      page: costs.mangaPage ?? 40,
      chapter: costs.mangaChapter ?? 150,
    };
    return map[mode] ?? calcGenerationCost(nodes.length, mode);
  }, [nodes.length, costs, getResolvedOutputMode]);

  const generate = async () => {
    const prompt = buildFlowPrompt(nodes, edges, {
      ...globalSettings,
      storySynopsis: [story.logline, story.synopsis].filter(Boolean).join(" — "),
    });
    if (prompt.length < 12) {
      toast.error(t("manga_err_prompt_short"));
      return;
    }
    const mode = getResolvedOutputMode();
    const endpoint =
      mode === "chapter"
        ? "/generate/manga-chapter"
        : mode === "page"
          ? "/generate/manga-page"
          : "/generate/manga-panel";
    const cost = genCost;

    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("manga_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setStatus(t("manga_generating"));
    setEdgesGenerating(true);
    try {
      let finalPrompt = prompt;
      if (globalSettings.gptCompose) {
        const composed = await composeMangaPromptApi({
          mode: mode === "chapter" ? "chapter" : mode === "page" ? "page" : "panel",
          panels: [],
          project: { stylePreset: globalSettings.style, pageLayout: "horizontal" },
          lang: lang || "pt",
          useGpt: true,
        });
        finalPrompt = composed.prompt || prompt;
      }

      const { data } = await api.post(
        endpoint,
        {
          prompt_final: finalPrompt.trim(),
          aspect_ratio: "4:5",
          model_key: globalSettings.engine,
        },
        { timeout: 90000, headers: { "X-Skip-Auto-Poll": "1" } },
      );

      if (!data?.prediction_id) {
        const url = data?.creation?.result_urls?.[0];
        if (url) toast.success(t("manga_success_panel", { n: cost }));
        else throw new Error(t("manga_err_no_prediction"));
      } else {
        const polled = await pollPrediction(data.prediction_id, {
          credits_spent: data.credits_spent ?? cost,
          type: "manga",
          timeoutMs: 300000,
        });
        const url = polled?.creation?.result_urls?.[0];
        if (!url) throw new Error(t("manga_err_no_url"));
        toast.success(t("manga_success_panel", { n: polled?.creation?.credits_spent ?? cost }));
      }
      await refresh();
      setStatus("");
    } catch (e) {
      const msg = formatApiError(e, t("manga_fail"));
      setStatus(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setEdgesGenerating(false);
    }
  };

  const onPreview = () => {
    const seq = orderNodesByFlow(nodes, edges);
    if (!seq.length) {
      toast.message("Adiciona elementos e ligações no canvas");
      return;
    }
    toast.message(`Preview: ${seq.length} passos na cena ativa`);
  };

  return (
    <div className="as-root" data-testid="anime-studio-page">
      <StudioToolbar
        busy={busy}
        genCost={genCost}
        onGenerate={generate}
        onPreview={onPreview}
        projectName={projectName}
        onRenameProject={setProjectName}
      />
      {status && (
        <div className="as-status-banner" role="status">
          {busy && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
          <span>{status}</span>
        </div>
      )}
      <StudioWorkspace busy={busy} genCost={genCost} onGenerate={generate} />
    </div>
  );
}
