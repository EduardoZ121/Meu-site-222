import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Redo2,
  Save,
  Settings2,
  Sparkles,
  Undo2,
  Upload,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFlowStore } from "./useFlowStore";

export default function StudioToolbar({
  busy,
  genCost,
  onGenerate,
  onPreview,
  projectName,
  onRenameProject,
}) {
  const navigate = useNavigate();
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const exportProjectJson = useFlowStore((s) => s.exportProjectJson);
  const importProjectJson = useFlowStore((s) => s.importProjectJson);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const setGlobalSettings = useFlowStore((s) => s.setGlobalSettings);
  const nodes = useFlowStore((s) => s.nodes);

  const handleSave = () => {
    toast.success("Projeto guardado localmente");
  };

  const handleExport = () => {
    const json = exportProjectJson();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName || "anime-studio"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Projeto exportado");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const text = await f.text();
      if (importProjectJson(text)) toast.success("Projeto importado");
      else toast.error("Ficheiro inválido");
    };
    input.click();
  };

  return (
    <header className="as-toolbar" data-testid="anime-studio-toolbar">
      <div className="as-toolbar-left">
        <button type="button" className="as-toolbar-icon" onClick={() => navigate("/app/tools")} aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="as-toolbar-brand">
          <span className="as-toolbar-logo">🎌</span>
          <div>
            <button
              type="button"
              className="as-toolbar-title"
              onClick={() => {
                const n = window.prompt("Nome do projeto", projectName);
                if (n?.trim()) onRenameProject(n.trim());
              }}
            >
              {projectName}
            </button>
            <span className="as-toolbar-sub">Anime / Manga Studio</span>
          </div>
        </div>
      </div>

      <div className="as-toolbar-center">
        <button type="button" className="as-toolbar-btn" onClick={undo} title="Desfazer">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" className="as-toolbar-btn" onClick={redo} title="Refazer">
          <Redo2 className="w-4 h-4" />
        </button>
        <button type="button" className="as-toolbar-btn" onClick={onPreview} title="Preview">
          <Eye className="w-4 h-4" />
        </button>
        <button type="button" className="as-toolbar-btn" onClick={handleSave} title="Salvar">
          <Save className="w-4 h-4" />
        </button>
        <button type="button" className="as-toolbar-btn" onClick={handleImport} title="Importar">
          <Upload className="w-4 h-4" />
        </button>
        <button type="button" className="as-toolbar-btn" onClick={handleExport} title="Exportar">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="as-toolbar-right">
        <label className="as-toolbar-compose">
          <input
            type="checkbox"
            checked={!!globalSettings.gptCompose}
            onChange={(e) => setGlobalSettings({ gptCompose: e.target.checked })}
          />
          <Sparkles className="w-3.5 h-3.5" />
          GPT
        </label>
        <button type="button" className="as-toolbar-btn" title="Configurações">
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="as-toolbar-generate"
          disabled={busy || !nodes.length}
          onClick={onGenerate}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Gerar · {genCost} cr
        </button>
      </div>
    </header>
  );
}
