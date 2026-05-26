import { useMemo, useState } from "react";
import {
  Plus, Sparkles, Star, Lock, Link2, Users, Zap, Trash2,
} from "lucide-react";
import ImageUploadZone from "../ImageUploadZone";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { characterHasReference } from "../../lib/mangaCharacterRef";
import { mangaCharacterFromUpload } from "../../lib/mangaImageUpload";
import {
  MANGA_INTERACTION_TYPES,
  MANGA_RELATION_TYPES,
  defaultInteractionConfig,
  emptySavedInteraction,
} from "../../lib/mangaCharacterInteractions";

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
  onUsePresetInEditor,
}) {
  const { t } = useI18n();
  const [tagInput, setTagInput] = useState("");
  const [presetPartner, setPresetPartner] = useState("");
  const [presetType, setPresetType] = useState("talk");

  const others = useMemo(
    () => characters.filter((x) => x.id !== c.id),
    [characters, c.id],
  );

  const selfHasRef = characterHasReference(c);
  const canSaveIxPreset = Boolean(presetPartner && others.some((x) => x.id === presetPartner));

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

  const handleSaveIxPreset = () => {
    const partner = others.find((x) => x.id === presetPartner);
    if (!partner) return;
    const saved = emptySavedInteraction({
      partnerId: partner.id,
      partnerName: partner.name,
      interactionType: presetType,
      config: { ...defaultInteractionConfig(partner.id), interactionType: presetType, partnerId: partner.id },
      resultThumb: null,
    });
    patch({
      savedInteractions: [saved, ...(c.savedInteractions || [])].slice(0, 12),
    });
  };

  return (
    <div className="manga-char-detail space-y-2.5" data-testid={`manga-char-detail-${c.id}`}>
      <ImageUploadZone
        value={c._refFile || null}
        onChange={(file) => onUpdate(mangaCharacterFromUpload(c, file))}
        layout="portrait"
        testId={`manga-char-upload-${c.id}`}
        emptyLabel={t("manga_upload_png")}
        emptyHint={t("upload_empty_hint")}
        enableRemotePersist={false}
        compressOptions={{ maxSize: 1280, maxBytes: 2 * 1024 * 1024 }}
      />

      <p
        className={cn(
          "text-[10px] rounded-md px-2 py-1 border",
          selfHasRef
            ? "text-emerald-400/90 border-emerald-500/30 bg-emerald-500/10"
            : "text-amber-400/90 border-amber-500/30 bg-amber-500/10",
        )}
      >
        {selfHasRef ? t("manga_char_ref_ok") : t("manga_char_ref_missing")}
      </p>

      <button
        type="button"
        className="manga-chip-btn w-full justify-center"
        onClick={() => {
          const desc = window.prompt(t("manga_char_desc_ai"), c.description || "");
          if (desc === null) return;
          patch({ description: desc, tag: desc.slice(0, 48) });
        }}
      >
        <Sparkles className="w-3 h-3" /> {t("manga_ia_sheet")}
      </button>

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

      <div className="manga-char-block">
        <p className="manga-char-block__title flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-[#A855F7]" />
          {t("manga_lib_ix_presets")}
        </p>
        <p className="text-[10px] text-[#5A5A5E] leading-snug mb-2">{t("manga_lib_ix_presets_hint")}</p>
        {others.length > 0 ? (
          <div className="space-y-2">
            <MiniSelect
              label={t("manga_ix_partner")}
              value={presetPartner}
              onChange={setPresetPartner}
              options={[
                { value: "", label: t("manga_ix_pick_partner") },
                ...others.map((o) => ({ value: o.id, label: o.name })),
              ]}
            />
            <MiniSelect
              label={t("manga_ix_type_label")}
              value={presetType}
              onChange={setPresetType}
              options={interactionOptions.map((o) => ({ value: o.id, label: o.label }))}
            />
            <button
              type="button"
              className="manga-chip-btn w-full justify-center"
              disabled={!canSaveIxPreset}
              onClick={handleSaveIxPreset}
            >
              <Zap className="w-3.5 h-3.5" />
              {t("manga_ix_save_preset")}
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[#5A5A5E]">{t("manga_ix_need_two")}</p>
        )}
      </div>

      {(c.savedInteractions || []).length > 0 && (
        <div className="manga-char-block">
          <p className="manga-char-block__title">{t("manga_char_saved_ix")}</p>
          <ul className="space-y-1">
            {(c.savedInteractions || []).slice(0, 8).map((ix) => {
              const p = characters.find((x) => x.id === ix.partnerId);
              return (
                <li key={ix.id} className="flex gap-1">
                  <button
                    type="button"
                    className="manga-chip-btn flex-1 justify-between min-w-0"
                    onClick={() =>
                      onUsePresetInEditor?.({
                        characterId: c.id,
                        preset: ix,
                      })}
                  >
                    <span className="truncate text-left">
                      {t(`manga_ix_type_${ix.interactionType}`)} · {p?.name || "?"}
                    </span>
                    <span className="text-[#A855F7] shrink-0">→ {t("manga_use_in_editor")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
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
