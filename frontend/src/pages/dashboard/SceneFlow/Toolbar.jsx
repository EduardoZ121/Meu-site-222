import { useSceneFlowStore } from "./store";
import { Settings2 } from "lucide-react";

const selectCls = "bg-[#16161A] border border-[#2E2E30] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C3AED] hover:border-[#5A5A5E] transition-colors cursor-pointer";

export default function Toolbar({ onGenerate, isGenerating }) {
  const global = useSceneFlowStore((s) => s.globalSettings);
  const update = useSceneFlowStore((s) => s.updateGlobal);
  const nodeCount = useSceneFlowStore((s) => s.nodes.length);

  return (
    <header
      className="absolute top-0 left-0 right-0 z-10 bg-[#0B0B0C]/85 backdrop-blur-md border-b border-[#2E2E30] px-4 py-2.5 flex items-center gap-2 flex-wrap"
      data-testid="scene-toolbar"
    >
      <div className="flex items-center gap-1.5 mr-2">
        <Settings2 className="w-4 h-4 text-[#7C3AED]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-white">Scene Flow</span>
      </div>

      <select value={global.output} onChange={(e) => update({ output: e.target.value })} className={selectCls} data-testid="output-select">
        <option value="single">Painel Único</option>
        <option value="manga_page_4">Página Mangá (4 quadros)</option>
        <option value="manga_page_6">Página Mangá (6 quadros)</option>
        <option value="storyboard">Storyboard</option>
      </select>

      <select value={global.style} onChange={(e) => update({ style: e.target.value })} className={selectCls} data-testid="style-select">
        <option value="manga_bw">Manga B&amp;W</option>
        <option value="manga_color">Manga Color</option>
        <option value="webtoon">Webtoon</option>
        <option value="comic_us">Comic US</option>
      </select>

      <select value={global.aspect} onChange={(e) => update({ aspect: e.target.value })} className={selectCls} data-testid="aspect-select">
        <option value="3:4">3:4</option>
        <option value="1:1">1:1</option>
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
        <option value="2:3">2:3</option>
      </select>

      <select value={global.model} onChange={(e) => update({ model: e.target.value })} className={selectCls} data-testid="model-select">
        <option value="fast">Motor Rápido (Grok)</option>
        <option value="gpt">Motor GPT</option>
        <option value="aurora">Aurora</option>
      </select>

      <div className="flex-1" />

      <span className="text-[10px] text-[#5A5A5E] uppercase tracking-wider hidden sm:inline">
        {nodeCount} caixa{nodeCount === 1 ? "" : "s"}
      </span>

      <button
        onClick={onGenerate}
        disabled={isGenerating || nodeCount === 0}
        className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all"
        data-testid="generate-btn"
      >
        {isGenerating ? "A gerar…" : "Gerar"}
      </button>
    </header>
  );
}
