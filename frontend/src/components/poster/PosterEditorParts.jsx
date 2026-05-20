import { Plus, Trash2, Type } from "lucide-react";
import CollapsibleSection from "../CollapsibleSection";
import { newCustomTextBlock } from "../../lib/posterPrompt";
import { useI18n } from "../../lib/i18n";

function textLayerTitles(t) {
  return [
    t("post_field_title"),
    t("post_field_subtitle"),
    t("post_field_body"),
    t("post_field_cta"),
    t("post_field_footer"),
    "Hashtag",
  ];
}

function textPositions(t) {
  return [
    { key: "top-left", label: t("post_pos_tl") },
    { key: "top-center", label: t("post_pos_tc") },
    { key: "top-right", label: t("post_pos_tr") },
    { key: "center", label: t("post_pos_center") },
    { key: "bottom-left", label: t("post_pos_bl") },
    { key: "bottom-center", label: t("post_pos_bc") },
    { key: "bottom-right", label: t("post_pos_br") },
  ];
}

export function PosterSection({
  title, optional, hint, children, defaultOpen = false, testId,
}) {
  return (
    <CollapsibleSection
      title={title}
      optional={optional}
      hint={hint}
      defaultOpen={defaultOpen}
      testId={testId}
      variant="boxed"
    >
      {children}
    </CollapsibleSection>
  );
}

export function CustomTextLayersEditor({ blocks, onChange }) {
  const { t } = useI18n();
  const layerTitles = textLayerTitles(t);
  const positions = textPositions(t);
  const update = (id, patch) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const remove = (id) => onChange(blocks.filter((b) => b.id !== id));
  const add = () => onChange([...blocks, newCustomTextBlock({
    title: layerTitles[blocks.length % layerTitles.length],
  })]);

  return (
    <div className="space-y-3" data-testid="poster-text-layers">
      {blocks.length === 0 && (
        <p className="text-[#8A8A8E] text-[12px]">{t("post_layer_empty")}</p>
      )}
      {blocks.map((b, idx) => (
        <div key={b.id} className="rounded-lg border border-[#2E2E30] bg-[#0B0B0C] p-3 space-y-2.5" data-testid={`poster-layer-${idx}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Type className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
              <span className="text-[#5A5A5E] text-[10px] font-mono">{t("post_layer_n", { n: idx + 1 })}</span>
            </div>
            <button
              type="button"
              onClick={() => remove(b.id)}
              className="p-1.5 rounded-md text-[#8A8A8E] hover:text-red-400 hover:bg-red-500/10"
              aria-label={t("post_layer_remove")}
              data-testid={`poster-layer-remove-${idx}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_label")}</label>
              <select
                value={b.title}
                onChange={(e) => update(b.id, { title: e.target.value })}
                className="w-full bg-[#13131A] border border-[#2E2E30] text-[#F4F1EA] text-[12px] px-2 py-2 rounded-md"
              >
                {layerTitles.map((title) => <option key={title} value={title}>{title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_position")}</label>
              <select
                value={b.position}
                onChange={(e) => update(b.id, { position: e.target.value })}
                className="w-full bg-[#13131A] border border-[#2E2E30] text-[#F4F1EA] text-[12px] px-2 py-2 rounded-md"
              >
                {positions.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_text")}</label>
            <textarea
              rows={2}
              value={b.text}
              onChange={(e) => update(b.id, { text: e.target.value })}
              placeholder='ex: "SUMMER SALE 50%"'
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[13px] px-3 py-2 rounded-md resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_size")}</label>
              <select
                value={b.size}
                onChange={(e) => update(b.id, { size: e.target.value })}
                className="w-full bg-[#13131A] border border-[#2E2E30] text-[#F4F1EA] text-[11px] px-2 py-1.5 rounded-md"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
                <option value="hero">Hero</option>
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_style")}</label>
              <select
                value={b.style}
                onChange={(e) => update(b.id, { style: e.target.value })}
                className="w-full bg-[#13131A] border border-[#2E2E30] text-[#F4F1EA] text-[11px] px-2 py-1.5 rounded-md"
              >
                <option value="display">Display</option>
                <option value="sans">Sans</option>
                <option value="serif">Serif</option>
                <option value="script">Script</option>
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8E] text-[10px] uppercase tracking-wider mb-1 block">{t("post_layer_color")}</label>
              <input
                type="color"
                value={b.color || "#7C3AED"}
                onChange={(e) => update(b.id, { color: e.target.value })}
                className="w-full h-8 rounded-md border border-[#2E2E30] cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#7C3AED]/50 text-[#C4B5FD] text-[12px] font-medium hover:bg-[#7C3AED]/10 transition-colors"
        data-testid="poster-add-text-layer"
      >
        <Plus className="w-4 h-4" /> {t("post_add_layer")}
      </button>
    </div>
  );
}
