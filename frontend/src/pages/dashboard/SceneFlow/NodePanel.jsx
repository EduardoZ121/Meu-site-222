import { useSceneFlowStore } from "./store";
import { TYPE_META } from "./nodes";
import { X, Trash2, Copy } from "lucide-react";
import { useState } from "react";

const TABS = {
  personagem: ["Geral", "Aparência", "Roupa", "Pose & Expressão", "Referências"],
  cenario:    ["Geral", "Iluminação", "Clima", "Hora", "Referências"],
  objeto:     ["Geral", "Estado", "Interação", "Ângulo", "Efeitos"],
  efeito:     ["Geral", "Tipo", "Intensidade", "Cor"],
  camera:     ["Geral", "Plano", "Ângulo", "Lente"],
  texto:      ["Geral", "Tipo", "Conteúdo", "Posição"],
  grupo:      ["Geral"],
};

const inputCls = "w-full bg-[#0B0B0C] border border-[#2E2E30] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#5A5A5E] focus:outline-none focus:border-[#7C3AED] transition-colors";
const labelCls = "block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-1.5";

function Field({ label, children }) {
  return <div className="mb-4"><label className={labelCls}>{label}</label>{children}</div>;
}

export default function NodePanel() {
  const selectedNodeId = useSceneFlowStore((s) => s.selectedNodeId);
  const node = useSceneFlowStore((s) => s.nodes.find((n) => n.id === selectedNodeId));
  const updateNodeData = useSceneFlowStore((s) => s.updateNodeData);
  const deleteNode = useSceneFlowStore((s) => s.deleteNode);
  const duplicateNode = useSceneFlowStore((s) => s.duplicateNode);
  const setSelectedNode = useSceneFlowStore((s) => s.setSelectedNode);
  const [activeTab, setActiveTab] = useState(0);

  if (!node) return null;
  const meta = TYPE_META[node.type] || TYPE_META.personagem;
  const tabs = TABS[node.type] || ["Geral"];
  const Icon = meta.icon;

  const upd = (patch) => updateNodeData(node.id, patch);

  return (
    <aside
      className="fixed sm:absolute right-0 top-0 sm:top-auto bottom-0 sm:bottom-0 w-full sm:w-[340px] bg-[#0F0F11] border-l border-[#2E2E30] z-20 flex flex-col"
      data-testid="node-panel"
    >
      <header className="px-4 py-3 border-b border-[#2E2E30] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}22` }}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        <input
          value={node.data.label || ""}
          onChange={(e) => upd({ label: e.target.value })}
          className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none"
          data-testid="node-label-input"
        />
        <button onClick={() => duplicateNode(node.id)} className="p-1.5 text-[#9CA3AF] hover:text-white" title="Duplicar" data-testid="node-duplicate-btn">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={() => { deleteNode(node.id); }} className="p-1.5 text-[#9CA3AF] hover:text-rose-400" title="Excluir" data-testid="node-delete-btn">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => setSelectedNode(null)} className="p-1.5 text-[#9CA3AF] hover:text-white" data-testid="node-close-btn">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex overflow-x-auto border-b border-[#2E2E30] px-2">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
              i === activeTab ? "text-white border-b-2" : "text-[#5A5A5E] hover:text-[#9CA3AF]"
            }`}
            style={i === activeTab ? { borderColor: meta.color } : {}}
            data-testid={`node-tab-${i}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {node.type === "personagem" && (
          <>
            <Field label="Descrição geral (livre)">
              <textarea rows={3} className={inputCls} value={node.data.appearance || ""}
                onChange={(e) => upd({ appearance: e.target.value })} placeholder="Mulher, cabelo preto longo, olhos verdes…" />
            </Field>
            <Field label="Roupa / Wardrobe">
              <input className={inputCls} value={node.data.outfit || ""} onChange={(e) => upd({ outfit: e.target.value })}
                placeholder="Vestido vermelho, jaqueta de cabedal…" />
            </Field>
            <Field label="Pose">
              <input className={inputCls} value={node.data.pose || ""} onChange={(e) => upd({ pose: e.target.value })}
                placeholder="Em pé, mãos nos bolsos…" />
            </Field>
            <Field label="Expressão facial">
              <input className={inputCls} value={node.data.expression || ""} onChange={(e) => upd({ expression: e.target.value })}
                placeholder="Sério, sorriso ligeiro…" />
            </Field>
          </>
        )}

        {node.type === "cenario" && (
          <>
            <Field label="Iluminação">
              <select className={inputCls} value={node.data.lighting || "natural"} onChange={(e) => upd({ lighting: e.target.value })}>
                <option value="natural">Natural</option><option value="golden_hour">Golden hour</option>
                <option value="blue_hour">Blue hour</option><option value="neon">Neon</option>
                <option value="dramatic">Dramática</option><option value="soft">Suave</option>
              </select>
            </Field>
            <Field label="Clima">
              <select className={inputCls} value={node.data.weather || "clear"} onChange={(e) => upd({ weather: e.target.value })}>
                <option value="clear">Limpo</option><option value="rain">Chuva</option>
                <option value="snow">Neve</option><option value="fog">Nevoeiro</option>
                <option value="storm">Tempestade</option>
              </select>
            </Field>
            <Field label="Hora do dia">
              <select className={inputCls} value={node.data.time || "day"} onChange={(e) => upd({ time: e.target.value })}>
                <option value="dawn">Amanhecer</option><option value="day">Dia</option>
                <option value="dusk">Anoitecer</option><option value="night">Noite</option>
              </select>
            </Field>
            <Field label="Descrição livre / camadas">
              <textarea rows={3} className={inputCls} value={node.data.layers || ""}
                onChange={(e) => upd({ layers: e.target.value })} placeholder="Cidade futurista, arranha-céus ao fundo, ruelas neon…" />
            </Field>
          </>
        )}

        {node.type === "objeto" && (
          <>
            <Field label="Estado"><input className={inputCls} value={node.data.state || ""} onChange={(e) => upd({ state: e.target.value })} placeholder="Partido, brilhante…" /></Field>
            <Field label="Interação"><input className={inputCls} value={node.data.interaction || ""} onChange={(e) => upd({ interaction: e.target.value })} placeholder="Sendo segurado, em queda…" /></Field>
            <Field label="Ângulo"><input className={inputCls} value={node.data.angle || ""} onChange={(e) => upd({ angle: e.target.value })} placeholder="Frontal, perspectiva…" /></Field>
            <Field label="Efeitos visuais"><input className={inputCls} value={node.data.effects || ""} onChange={(e) => upd({ effects: e.target.value })} placeholder="Brilho, faíscas…" /></Field>
          </>
        )}

        {node.type === "efeito" && (
          <>
            <Field label="Tipo">
              <select className={inputCls} value={node.data.kind || "smoke"} onChange={(e) => upd({ kind: e.target.value })}>
                <option value="smoke">Fumo</option><option value="fire">Fogo</option>
                <option value="sparks">Faíscas</option><option value="dust">Poeira</option>
                <option value="magic">Magia</option><option value="speed_lines">Linhas de velocidade</option>
              </select>
            </Field>
            <Field label={`Intensidade (${node.data.intensity || 0}%)`}>
              <input type="range" min="0" max="100" value={node.data.intensity || 0}
                onChange={(e) => upd({ intensity: parseInt(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Cor">
              <input type="color" value={node.data.color || "#7C3AED"} onChange={(e) => upd({ color: e.target.value })}
                className="w-full h-10 rounded-lg bg-[#0B0B0C] border border-[#2E2E30]" />
            </Field>
          </>
        )}

        {node.type === "camera" && (
          <>
            <Field label="Plano">
              <select className={inputCls} value={node.data.shot || "medium"} onChange={(e) => upd({ shot: e.target.value })}>
                <option value="close">Close</option><option value="medium">Médio</option>
                <option value="wide">Wide</option><option value="extreme_close">Extreme close-up</option>
                <option value="aerial">Aéreo</option>
              </select>
            </Field>
            <Field label="Ângulo">
              <select className={inputCls} value={node.data.angle || "eye"} onChange={(e) => upd({ angle: e.target.value })}>
                <option value="eye">Eye-level</option><option value="low">Baixo</option>
                <option value="high">Alto</option><option value="dutch">Holandês</option>
              </select>
            </Field>
            <Field label="Lente"><input className={inputCls} value={node.data.lens || ""} onChange={(e) => upd({ lens: e.target.value })} placeholder="35mm, 50mm, 85mm…" /></Field>
          </>
        )}

        {node.type === "texto" && (
          <>
            <Field label="Tipo de balão">
              <select className={inputCls} value={node.data.balloon || "speech"} onChange={(e) => upd({ balloon: e.target.value })}>
                <option value="speech">Fala</option><option value="thought">Pensamento</option>
                <option value="shout">Grito</option><option value="whisper">Sussurro</option>
                <option value="narration">Narração</option>
              </select>
            </Field>
            <Field label="Conteúdo">
              <textarea rows={3} className={inputCls} value={node.data.content || ""}
                onChange={(e) => upd({ content: e.target.value })} placeholder="O que dizer…" />
            </Field>
            <Field label="Posição">
              <select className={inputCls} value={node.data.position || "top"} onChange={(e) => upd({ position: e.target.value })}>
                <option value="top">Topo</option><option value="bottom">Fundo</option>
                <option value="left">Esquerda</option><option value="right">Direita</option>
              </select>
            </Field>
          </>
        )}

        {node.type === "grupo" && (
          <Field label="Cor do grupo">
            <input type="color" value={node.data.color || "#7C3AED"} onChange={(e) => upd({ color: e.target.value })}
              className="w-full h-10 rounded-lg bg-[#0B0B0C] border border-[#2E2E30]" />
          </Field>
        )}
      </div>
    </aside>
  );
}
