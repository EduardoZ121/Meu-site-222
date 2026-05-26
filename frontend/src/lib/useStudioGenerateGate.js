import { useMemo } from "react";
import { useI18n } from "./i18n";

export function hasStudioCredits(user, cost = 0) {
  if (!cost) return true;
  if (user?.is_unlimited || user?.role === "admin") return true;
  return (user?.credits ?? 0) >= cost;
}

/**
 * Estado unificado do botão Gerar: pronto só quando requisitos + créditos OK.
 */
export function useStudioGenerateGate({
  busy = false,
  user,
  cost = 0,
  requirePhoto = false,
  photo = null,
  requireVideo = false,
  video = null,
  requirePrompt = false,
  prompt = "",
  promptMin = 3,
  requirePreset = false,
  preset = null,
  missingCount = 0,
  blocked = false,
  uploading = false,
  /** Se definido, substitui o cálculo de ready (hint manual opcional). */
  readyOverride,
  hintOverride,
}) {
  const { t } = useI18n();

  return useMemo(() => {
    if (busy) return { ready: false, hint: null };

    let hint = hintOverride ?? null;

    if (hint == null && uploading) hint = t("upload_preparing");
    if (hint == null && blocked) hint = t("studio_gen_hint_blocked");
    if (hint == null && missingCount > 0) hint = t("studio_gen_hint_fields");
    if (hint == null && requireVideo && !video) hint = t("studio_gen_hint_video");
    if (hint == null && requirePhoto && !photo) hint = t("studio_gen_hint_photo");
    if (hint == null && requirePreset && !preset) hint = t("studio_gen_hint_preset");
    if (hint == null && requirePrompt && String(prompt || "").trim().length < promptMin) {
      hint = t("studio_gen_hint_prompt");
    }
    if (hint == null && cost > 0 && !hasStudioCredits(user, cost)) {
      hint = t("studio_gen_hint_credits", { need: cost, have: user?.credits ?? 0 });
    }

    const prerequisitesOk = readyOverride !== undefined
      ? Boolean(readyOverride)
      : !hint;

    const ready = prerequisitesOk && !busy && !hint;

    return { ready, hint: ready ? null : hint };
  }, [
    busy,
    blocked,
    cost,
    hintOverride,
    missingCount,
    photo,
    preset,
    prompt,
    promptMin,
    readyOverride,
    requirePhoto,
    requirePreset,
    requirePrompt,
    requireVideo,
    t,
    uploading,
    user,
    video,
  ]);
}
