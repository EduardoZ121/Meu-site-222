import { toast } from "sonner";
import { useFlowStore } from "./useFlowStore";
import { NODE_ICONS, NODE_LABELS } from "./types";
import UploadField, { readImageFile } from "./UploadField";
import { calcConsistencyScore } from "./buildFlowPrompt";

function ChipRow({ options, value, onChange }) {
  return (
    <div className="mf-chips">
      {options.map((o) => {
        const id = o.id ?? o;
        const label = o.label ?? o;
        return (
          <button
            key={id}
            type="button"
            className={`mf-chip ${value === id ? "mf-chip--on" : ""}`}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function patchPersonagem(data, patch) {
  const next = { ...data, ...patch };
  return { ...patch, consistencyScore: calcConsistencyScore(next) };
}

function PersonagemForm({ data, onChange }) {
  const exprKeys = ["normal", "happy", "sad", "angry", "fear"];
  const emoji = { normal: "😐", happy: "😊", sad: "😢", angry: "😠", fear: "😲" };
  const set = (p) => onChange(patchPersonagem(data, p));
  const score = data.consistencyScore ?? calcConsistencyScore(data);
  return (
    <>
      <UploadField
        label="Upload rosto de referência"
        onFile={({ url }) => set({ avatarUrl: url })}
      />
      <span className="text-[0.7rem] text-[#a855f7] uppercase">Body type</span>
      <ChipRow
        value={data.bodyType}
        onChange={(v) => set({ bodyType: v })}
        options={[
          { id: "slim", label: "Slim" },
          { id: "athletic", label: "Athletic" },
          { id: "curvy", label: "Curvy" },
          { id: "muscular", label: "Muscular" },
          { id: "chibi", label: "Chibi" },
        ]}
      />
      <p className="text-[0.75rem] text-[#9ca3af] mt-2">Reference sheet (4 ângulos)</p>
      {["front", "profile", "threeQuarter", "back"].map((k) => (
        <UploadField
          key={k}
          label={k}
          onFile={({ url }) =>
            set({ referenceSheet: { ...data.referenceSheet, [k]: url } })
          }
        />
      ))}
      <p className="text-[0.75rem] text-[#9ca3af]">Expressões</p>
      <div className="mf-chips">
        {exprKeys.map((k) => (
          <button
            key={k}
            type="button"
            className="mf-chip"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await readImageFile(f);
                set({ expressions: { ...data.expressions, [k]: url } });
              };
              input.click();
            }}
          >
            {emoji[k]} ⬆️
          </button>
        ))}
      </div>
      <p className="text-[0.75rem] text-[#9ca3af]">👕 Outfits</p>
      <div className="mf-chips flex-wrap">
        {(data.outfits || []).map((o) => (
          <button
            key={o.id}
            type="button"
            className={`mf-chip ${o.isDefault ? "mf-chip--on" : ""}`}
            onClick={() =>
              set({
                outfits: data.outfits.map((x) => ({ ...x, isDefault: x.id === o.id })),
              })
            }
          >
            {o.name}
          </button>
        ))}
        <button
          type="button"
          className="mf-chip"
          onClick={() => {
            const id = `outfit_${Date.now()}`;
            set({
              outfits: [...(data.outfits || []), { id, name: "Novo", thumb: null, isDefault: false }],
            });
          }}
        >
          + Adicionar
        </button>
      </div>
      <UploadField
        label="Upload outfit ativo"
        onFile={({ url }) => {
          const active = (data.outfits || []).find((o) => o.isDefault) || data.outfits?.[0];
          if (!active) return;
          set({
            outfits: data.outfits.map((o) => (o.id === active.id ? { ...o, thumb: url } : o)),
          });
        }}
      />
      <div className="mf-consistency mt-2">
        <span className="text-[0.75rem] text-[#9ca3af]">🔒 Consistency: {score}%</span>
        <div className="mf-consistency-bar">
          <div className="mf-consistency-fill" style={{ width: `${score}%` }} />
        </div>
        {score < 60 && (
          <p className="text-[0.7rem] text-[#a855f7]">Adicione mais ângulos de referência</p>
        )}
      </div>
    </>
  );
}

function CenarioForm({ data, onChange }) {
  return (
    <>
      <UploadField label="Upload imagem de fundo" onFile={({ url }) => onChange({ backgroundUrl: url })} />
      <input
        className="mf-field"
        placeholder="Localização"
        value={data.location || ""}
        onChange={(e) => onChange({ location: e.target.value })}
      />
      <ChipRow
        value={data.timeOfDay}
        onChange={(v) => onChange({ timeOfDay: v })}
        options={[
          { id: "dawn", label: "Amanhecer" },
          { id: "morning", label: "Manhã" },
          { id: "noon", label: "Meio-dia" },
          { id: "afternoon", label: "Tarde" },
          { id: "sunset", label: "Pôr do sol" },
          { id: "night", label: "Noite" },
        ]}
      />
      <ChipRow
        value={data.weather}
        onChange={(v) => onChange({ weather: v })}
        options={[
          { id: "clear", label: "Limpo" },
          { id: "cloudy", label: "Nublado" },
          { id: "rain", label: "Chuva" },
          { id: "snow", label: "Neve" },
          { id: "fog", label: "Nevoeiro" },
          { id: "storm", label: "Tempestade" },
        ]}
      />
      <p className="text-[0.75rem] text-[#9ca3af]">
        Luz: {Math.round((data.lightingIntensity ?? 0.65) * 100)}% · {data.lightingDirection ?? 120}°
      </p>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((data.lightingIntensity ?? 0.65) * 100)}
        onChange={(e) => onChange({ lightingIntensity: Number(e.target.value) / 100 })}
        className="w-full"
      />
      <ChipRow
        value={data.lightingTemp}
        onChange={(v) => onChange({ lightingTemp: v })}
        options={[
          { id: "warm", label: "Warm" },
          { id: "neutral", label: "Neutral" },
          { id: "cool", label: "Cool" },
          { id: "dramatic", label: "Dramatic" },
        ]}
      />
      <p className="text-[0.75rem] text-[#9ca3af]">
        Direção da luz: {data.lightingDirection ?? 120}°
      </p>
      <input
        type="range"
        min={0}
        max={360}
        value={data.lightingDirection ?? 120}
        onChange={(e) => onChange({ lightingDirection: Number(e.target.value) })}
        className="w-full"
      />
      <p className="text-[0.75rem] text-[#9ca3af] mt-2">Variantes</p>
      <label className="flex items-center gap-2 text-[0.8rem]">
        <input
          type="checkbox"
          checked={data.variants?.day !== false}
          onChange={(e) => onChange({ variants: { ...data.variants, day: e.target.checked } })}
        />
        Dia
      </label>
      <label className="flex items-center gap-2 text-[0.8rem]">
        <input
          type="checkbox"
          checked={data.variants?.night !== false}
          onChange={(e) => onChange({ variants: { ...data.variants, night: e.target.checked } })}
        />
        Noite
      </label>
      <label className="flex items-center gap-2 text-[0.8rem]">
        <input
          type="checkbox"
          checked={!!data.variants?.rain}
          onChange={(e) => onChange({ variants: { ...data.variants, rain: e.target.checked } })}
        />
        Chuva
      </label>
    </>
  );
}

function ObjetoForm({ data, onChange }) {
  return (
    <>
      <UploadField onFile={({ url }) => onChange({ imageUrl: url })} />
      <textarea
        className="mf-field min-h-[72px]"
        placeholder="Descrição do objeto"
        value={data.description || ""}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <ChipRow
        value={data.position}
        onChange={(v) => onChange({ position: v })}
        options={[
          { id: "hand", label: "Mão" },
          { id: "ground", label: "Chão" },
          { id: "table", label: "Mesa" },
          { id: "wall", label: "Parede" },
          { id: "air", label: "Ar" },
        ]}
      />
      <ChipRow
        value={data.size}
        onChange={(v) => onChange({ size: v })}
        options={[
          { id: "small", label: "Pequeno" },
          { id: "medium", label: "Médio" },
          { id: "large", label: "Grande" },
        ]}
      />
    </>
  );
}

function AcaoForm({ data, onChange }) {
  return (
    <>
      <ChipRow
        value={data.category}
        onChange={(v) => onChange({ category: v })}
        options={[
          { id: "standing", label: "Em pé" },
          { id: "action", label: "Ação" },
          { id: "fight", label: "Luta" },
          { id: "emotional", label: "Emocional" },
        ]}
      />
      <ChipRow
        value={data.handPose}
        onChange={(v) => onChange({ handPose: v })}
        options={[
          { id: "fist", label: "Fechada" },
          { id: "open", label: "Aberta" },
          { id: "pointing", label: "Apontando" },
          { id: "holding", label: "Segurando" },
          { id: "peace", label: "Peace" },
          { id: "crossed", label: "Cruzadas" },
        ]}
      />
      <UploadField label="Upload pose PNG" onFile={({ url }) => onChange({ poseImageUrl: url })} />
      <p className="text-[0.75rem] text-[#9ca3af]">Intensidade: {Math.round((data.intensity ?? 0.5) * 100)}%</p>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((data.intensity ?? 0.5) * 100)}
        onChange={(e) => onChange({ intensity: Number(e.target.value) / 100 })}
        className="w-full"
      />
    </>
  );
}

function DialogoForm({ data, onChange }) {
  return (
    <>
      <textarea
        className="mf-field min-h-[72px]"
        placeholder="Texto do diálogo"
        value={data.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <ChipRow
        value={data.speechType}
        onChange={(v) => onChange({ speechType: v })}
        options={[
          { id: "speech", label: "Fala" },
          { id: "thought", label: "Pensamento" },
          { id: "shout", label: "Grito" },
          { id: "whisper", label: "Sussurro" },
          { id: "narration", label: "Narração" },
        ]}
      />
      <ChipRow
        value={data.balloonShape}
        onChange={(v) => onChange({ balloonShape: v })}
        options={[
          { id: "normal", label: "Normal" },
          { id: "cloud", label: "Nuvem" },
          { id: "irregular", label: "Irregular" },
          { id: "rect", label: "Retângulo" },
        ]}
      />
      <ChipRow
        value={data.fontStyle}
        onChange={(v) => onChange({ fontStyle: v })}
        options={[
          { id: "anime", label: "Anime" },
          { id: "manga", label: "Manga" },
          { id: "webtoon", label: "Webtoon" },
        ]}
      />
      <ChipRow
        value={data.position}
        onChange={(v) => onChange({ position: v })}
        options={[
          { id: "top", label: "Topo" },
          { id: "left", label: "Esquerda" },
          { id: "right", label: "Direita" },
          { id: "bottom", label: "Baixo" },
        ]}
      />
    </>
  );
}

function EfeitoForm({ data, onChange }) {
  return (
    <>
      <ChipRow
        value={data.effectType}
        onChange={(v) => onChange({ effectType: v })}
        options={[
          { id: "speed_lines", label: "Speed lines" },
          { id: "impact", label: "Impacto" },
          { id: "dramatic_shadow", label: "Sombra" },
          { id: "radial_focus", label: "Foco" },
          { id: "mosaic", label: "Censura" },
          { id: "blood", label: "Sangue" },
          { id: "chibi", label: "Chibi" },
        ]}
      />
      <p className="text-[0.75rem] text-[#9ca3af]">
        Intensidade: {Math.round((data.intensity ?? 0.4) * 100)}%
      </p>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((data.intensity ?? 0.4) * 100)}
        onChange={(e) => onChange({ intensity: Number(e.target.value) / 100 })}
        className="w-full"
      />
      <p className="text-[0.75rem] text-[#9ca3af]">Direção: {data.direction ?? 45}°</p>
      <input
        type="range"
        min={0}
        max={360}
        value={data.direction ?? 45}
        onChange={(e) => onChange({ direction: Number(e.target.value) })}
        className="w-full"
      />
      <ChipRow
        value={data.position}
        onChange={(v) => onChange({ position: v })}
        options={[
          { id: "center", label: "Centro" },
          { id: "character", label: "Personagem" },
          { id: "background", label: "Background" },
        ]}
      />
    </>
  );
}

function TransicaoForm({ data, onChange }) {
  return (
    <>
      <ChipRow
        value={data.transitionType}
        onChange={(v) => onChange({ transitionType: v })}
        options={[
          { id: "cut", label: "Cut" },
          { id: "fade", label: "Fade" },
          { id: "wipe", label: "Wipe" },
          { id: "dissolve", label: "Dissolve" },
          { id: "slide", label: "Slide" },
          { id: "zoom", label: "Zoom" },
        ]}
      />
      <ChipRow
        value={data.duration}
        onChange={(v) => onChange({ duration: v })}
        options={[
          { id: "instant", label: "Instantâneo" },
          { id: "0.5s", label: "0.5s" },
          { id: "1s", label: "1s" },
          { id: "2s", label: "2s" },
        ]}
      />
      <ChipRow
        value={data.direction}
        onChange={(v) => onChange({ direction: v })}
        options={[
          { id: "left-to-right", label: "← →" },
          { id: "right-to-left", label: "→ ←" },
          { id: "top-to-bottom", label: "↑ ↓" },
          { id: "bottom-to-top", label: "↓ ↑" },
        ]}
      />
    </>
  );
}

export default function NodeEditor() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return <p className="text-[#9ca3af] text-[0.85rem]">Seleciona uma caixa no canvas para editar.</p>;
  }

  const type = node.data.flowType;
  const patch = (p) => updateNodeData(node.id, p);

  const forms = {
    personagem: PersonagemForm,
    cenario: CenarioForm,
    objeto: ObjetoForm,
    acao: AcaoForm,
    dialogo: DialogoForm,
    efeito: EfeitoForm,
    transicao: TransicaoForm,
  };
  const Form = forms[type] || (() => <p>Tipo desconhecido</p>);

  return (
    <div>
      <div className="mf-slide-handle" />
      <h3 className="text-white font-semibold mb-2">
        {NODE_ICONS[type]} {NODE_LABELS[type]}: {node.data.name}
      </h3>
      <Form data={node.data} onChange={patch} />
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          className="mf-btn mf-btn--primary flex-1"
          onClick={() => toast.success("Caixa guardada no projeto")}
        >
          💾 Salvar
        </button>
        <button type="button" className="mf-btn flex-1" onClick={() => deleteNode(node.id)}>
          🗑️ Excluir
        </button>
      </div>
    </div>
  );
}
