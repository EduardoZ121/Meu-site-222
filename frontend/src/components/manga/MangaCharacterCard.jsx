import { useMemo, useState } from "react";
import {
  Plus, Upload, Sparkles, Star, Lock, Link2, MessageCircle, Users, Zap,
  ChevronDown, Image as ImageIcon, Trash2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import {
  MANGA_INTERACTION_TYPES,
  MANGA_CHAR_DISTANCES,
  MANGA_CHAR_EMOTIONS,
  MANGA_CHAR_FOCUS,
  MANGA_CHAR_GAZE,
  MANGA_RELATION_TYPES,
  defaultInteractionConfig,
  emptySavedInteraction,
} from "../../lib/mangaCharacterInteractions";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function MiniSelect({ label, value, onChange, options }) {
  return (
    <label className="manga-char-field">
      <span className="manga-char-field__label">{label}</span>
      <select
        className="manga-char-field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function MangaCharacterCard({
  character: c,
  characters,
  onUpdate,
  onGenerateInteraction,
  interactionBusy,
}) {
  const { t } = useI18n();
  const [ixOpen, setIxOpen] = useState(true);
  const [advOpen, setAdvOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [ixConfig, setIxConfig] = useState(() => defaultInteractionConfig());

  const others = useMemo(
    () => characters.filter((x) => x.id !== c.id),
    [characters, c.id],
  );

  const partner = others.find((x) => x.id === ixConfig.partnerId) || null;

  const interactionOptions = useMemo(
    () =>
      MANGA_INTERACTION_TYPES.map((item) => ({
        id: item.id,
        label: t(`manga_ix_type_${item.id}`),
      })),
    [t],
  );

  const patch = (partial) => onUpdate({ ...c, ...partial });

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || (c.tags || []).includes(v)) return;
    patch({ tags: [...(c.tags || []), v].slice(0, 12) });
    setTagInput("");
  };

  const addRelation = () => {
    if (!ixConfig.partnerId) return;
    const exists = (c.relations || []).some((r) => r.targetCharId === ixConfig.partnerId);
    if (exists) return;
    patch({
      relations: [
        ...(c.relations || []),
        {
          id: `rel_${Date.now()}`,
          targetCharId: ixConfig.partnerId,
          type: "ally",
        },
      ],
    });
  };

  const handleGenerate = () => {
    if (!ixConfig.partnerId || !partner) return;
    const typeMeta = interactionOptions.find((x) => x.id === ixConfig.interactionType);
    onGenerateInteraction({
      charA: c,
      charB: partner,
      config: {
        ...ixConfig,
        interactionLabel: typeMeta?.label || ixConfig.interactionType,
      },
    });
  };

  return (
    <div className="manga-char-detail space-y-2.5" data-testid={`manga-char-detail-${c.id}`}>
      <p className="text-[10px] text-[#5A5A5E]">{t("manga_ref_sheet")}</p>
      <div className="grid grid-cols-4 gap-1">
        {["front", "profile", "back"].map((k) => (
          <div
            key={k}
            className="aspect-square rounded bg-[#13131A] border border-[#2E2E30] text-[8px] text-[#5A5A5E] flex items-center justify-center uppercase overflow-hidden"
          >
            {c.sheets?.[k] ? (
              <img src={c.sheets[k]} alt="" className="w-full h-full object-cover" />
            ) : (
              k.slice(0, 4)
            )}
          </div>
        ))}
        <div className="aspect-square rounded bg-[#13131A] border border-[#2E2E30] text-[8px] text-[#5A5A5E] flex items-center justify-center">
          4×
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <label className="manga-chip-btn cursor-pointer">
          <Upload className="w-3 h-3" /> {t("manga_upload_png")}
          <input
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              let url = null;
              try {
                url = await readFileAsDataUrl(f);
              } catch {
                url = null;
              }
              patch({
                thumb: url,
                _refFile: f,
                sheets: { ...c.sheets, front: url },
              });
            }}
          />
        </label>
        <button
          type="button"
          className="manga-chip-btn"
          onClick={() => {
            const desc = window.prompt(t("manga_char_desc_ai"), c.description || "");
            if (desc === null) return;
            patch({ description: desc, tag: desc.slice(0, 48) });
          }}
        >
          <Sparkles className="w-3 h-3" /> {t("manga_ia_sheet")}
        </button>
      </div>

      <div className="manga-char-block">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="manga-char-block__title">{t("manga_char_meta")}</p>
          <div className="flex gap-1">
            <button
              type="button"
              className={cn("manga-char-toggle", c.favorite && "manga-char-toggle--on")}
              onClick={() => patch({ favorite: !c.favorite })}
              title={t("manga_char_favorite")}
            >
              <Star className="w-3 h-3" />
            </button>
            <button
              type="button"
              className={cn("manga-char-toggle", c.consistencyLock && "manga-char-toggle--on")}
              onClick={() => patch({ consistencyLock: !c.consistencyLock })}
              title={t("manga_char_consistency_lock")}
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap min-w-0">
          {(c.tags || []).map((tag) => (
            <span key={tag} className="manga-char-tag">
              {tag}
              <button
                type="button"
                className="manga-char-tag__x"
                onClick={() => patch({ tags: (c.tags || []).filter((x) => x !== tag) })}
                aria-label={t("manga_remove")}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1 min-w-0">
          <input
            className="manga-char-input flex-1 min-w-0"
            value={tagInput}
            placeholder={t("manga_char_tag_placeholder")}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          />
          <button type="button" className="manga-chip-btn shrink-0" onClick={addTag}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {(c.relations || []).length > 0 && (
        <div className="manga-char-block">
          <p className="manga-char-block__title flex items-center gap-1">
            <Link2 className="w-3 h-3" /> {t("manga_char_relations")}
          </p>
          <ul className="space-y-1">
            {(c.relations || []).map((rel) => {
              const other = characters.find((x) => x.id === rel.targetCharId);
              return (
                <li key={rel.id} className="manga-char-relation">
                  <span className="truncate">{other?.name || "?"}</span>
                  <select
                    className="manga-char-relation__type"
                    value={rel.type}
                    onChange={(e) => {
                      patch({
                        relations: (c.relations || []).map((r) =>
                          r.id === rel.id ? { ...r, type: e.target.value } : r),
                      });
                    }}
                  >
                    {MANGA_RELATION_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {t(`manga_rel_${tp}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="text-red-400/80 p-0.5"
                    onClick={() =>
                      patch({ relations: (c.relations || []).filter((r) => r.id !== rel.id) })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="manga-char-block manga-char-block--accent">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 text-left"
          onClick={() => setIxOpen(!ixOpen)}
        >
          <span className="manga-char-block__title flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#A855F7]" />
            {t("manga_char_interactions")}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-[#5A5A5E] transition-transform", ixOpen && "rotate-180")} />
        </button>

        {ixOpen && (
          <div className="mt-2.5 space-y-2.5">
            <MiniSelect
              label={t("manga_ix_partner")}
              value={ixConfig.partnerId || ""}
              onChange={(v) => setIxConfig((prev) => ({ ...prev, partnerId: v || null }))}
              options={[
                { value: "", label: t("manga_ix_pick_partner") },
                ...others.map((o) => ({ value: o.id, label: o.name })),
              ]}
            />

            {partner && (
              <>
                <p className="text-[10px] text-[#9CA3AF]">{t("manga_ix_type_label")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {interactionOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "manga-ix-type-btn",
                        ixConfig.interactionType === opt.id && "manga-ix-type-btn--active",
                      )}
                      onClick={() =>
                        setIxConfig((prev) => ({ ...prev, interactionType: opt.id }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MiniSelect
                    label={t("manga_ix_position", { name: c.name })}
                    value={ixConfig.slotA}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, slotA: v }))}
                    options={[
                      { value: "left", label: t("manga_ix_left") },
                      { value: "right", label: t("manga_ix_right") },
                    ]}
                  />
                  <MiniSelect
                    label={t("manga_ix_distance")}
                    value={ixConfig.distance}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, distance: v }))}
                    options={MANGA_CHAR_DISTANCES.map((d) => ({
                      value: d.id,
                      label: t(`manga_ix_dist_${d.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_emotion_a", { name: c.name })}
                    value={ixConfig.emotionA}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, emotionA: v }))}
                    options={MANGA_CHAR_EMOTIONS.map((e) => ({
                      value: e.id,
                      label: t(`manga_ix_emo_${e.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_emotion_b", { name: partner.name })}
                    value={ixConfig.emotionB}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, emotionB: v }))}
                    options={MANGA_CHAR_EMOTIONS.map((e) => ({
                      value: e.id,
                      label: t(`manga_ix_emo_${e.id}`),
                    }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_focus")}
                    value={ixConfig.focus}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, focus: v }))}
                    options={MANGA_CHAR_FOCUS.map((f) => ({
                      value: f.id,
                      label: t(`manga_ix_focus_${f.id}`),
                    }))}
                  />
                </div>

                <button
                  type="button"
                  className="text-[10px] text-[#A855F7] flex items-center gap-1"
                  onClick={() => setAdvOpen(!advOpen)}
                >
                  <ChevronDown className={cn("w-3 h-3 transition-transform", advOpen && "rotate-180")} />
                  {t("manga_ix_advanced")}
                </button>

                {advOpen && (
                  <div className="grid grid-cols-2 gap-2">
                    <MiniSelect
                      label={t("manga_ix_gaze_a", { name: c.name })}
                      value={ixConfig.gazeA}
                      onChange={(v) => setIxConfig((prev) => ({ ...prev, gazeA: v }))}
                      options={MANGA_CHAR_GAZE.map((g) => ({
                        value: g.id,
                        label: t(`manga_ix_gaze_${g.id}`),
                      }))}
                    />
                    <MiniSelect
                      label={t("manga_ix_gaze_b", { name: partner.name })}
                      value={ixConfig.gazeB}
                      onChange={(v) => setIxConfig((prev) => ({ ...prev, gazeB: v }))}
                      options={MANGA_CHAR_GAZE.map((g) => ({
                        value: g.id,
                        label: t(`manga_ix_gaze_${g.id}`),
                      }))}
                    />
                  </div>
                )}

                <div className="manga-char-block manga-char-block--dialogue">
                  <p className="manga-char-block__title flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {t("manga_ix_dialogue")}
                  </p>
                  <input
                    className="manga-char-input w-full"
                    placeholder={t("manga_ix_line_a", { name: c.name })}
                    value={ixConfig.dialogueA}
                    onChange={(e) =>
                      setIxConfig((prev) => ({ ...prev, dialogueA: e.target.value }))}
                  />
                  <input
                    className="manga-char-input w-full"
                    placeholder={t("manga_ix_line_b", { name: partner.name })}
                    value={ixConfig.dialogueB}
                    onChange={(e) =>
                      setIxConfig((prev) => ({ ...prev, dialogueB: e.target.value }))}
                  />
                  <MiniSelect
                    label={t("manga_ix_dialogue_order")}
                    value={ixConfig.dialogueOrder}
                    onChange={(v) => setIxConfig((prev) => ({ ...prev, dialogueOrder: v }))}
                    options={[
                      { value: "a_first", label: t("manga_ix_order_a_first") },
                      { value: "b_first", label: t("manga_ix_order_b_first") },
                    ]}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="manga-chip-btn" onClick={addRelation}>
                    <Link2 className="w-3 h-3" /> {t("manga_ix_save_relation")}
                  </button>
                  <button
                    type="button"
                    className="manga-generate-btn flex-1 min-w-[140px]"
                    disabled={interactionBusy}
                    onClick={handleGenerate}
                  >
                    {interactionBusy ? (
                      <span className="animate-pulse">{t("manga_ix_generating")}</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        {t("manga_ix_generate_scene")}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {!others.length && (
              <p className="text-[10px] text-[#5A5A5E]">{t("manga_ix_need_two")}</p>
            )}
          </div>
        )}
      </div>

      {(c.savedInteractions || []).length > 0 && (
        <div className="manga-char-block">
          <p className="manga-char-block__title">{t("manga_char_saved_ix")}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(c.savedInteractions || []).slice(0, 8).map((ix) => {
              const p = characters.find((x) => x.id === ix.partnerId);
              return (
                <button
                  key={ix.id}
                  type="button"
                  className="manga-char-ix-thumb"
                  onClick={() => {
                    if (ix.resultThumb) window.open(ix.resultThumb, "_blank", "noopener");
                  }}
                >
                  {ix.resultThumb ? (
                    <img src={ix.resultThumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#5A5A5E]" />
                  )}
                  <span className="manga-char-ix-thumb__cap">
                    {t(`manga_ix_type_${ix.interactionType}`)} · {p?.name || "?"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(c.variants || []).length > 0 && (
        <div className="manga-char-block">
          <p className="manga-char-block__title">{t("manga_char_variants")}</p>
          <ul className="text-[10px] text-[#9CA3AF] space-y-0.5">
            {(c.variants || []).map((v) => (
              <li key={v.id} className="truncate">
                {v.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        className="manga-chip-btn w-full justify-center"
        onClick={() => {
          const label = window.prompt(t("manga_char_variant_name"), t("manga_char_variant_default"));
          if (!label) return;
          patch({
            variants: [
              ...(c.variants || []),
              { id: `var_${Date.now()}`, label, note: "" },
            ],
          });
        }}
      >
        <Plus className="w-3 h-3" /> {t("manga_char_add_variant")}
      </button>
    </div>
  );
}
