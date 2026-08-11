/**
 * Sequential on-brand ad batch — submit all jobs first, then poll (avoids missing last image on long runs).
 */
const crypto = require("crypto");
const { getPending, pollPending } = require("../pendingPredictions.cjs");
const { buildNanoBananaPosterInput, resolvePosterModel } = require("../posterEngine.cjs");
const { pickBrandCampaignPreset } = require("./brandCampaignPresetLibrary.cjs");
const { resolveCategoryId } = require("./brandCampaignCategories.cjs");
const { resolveConceptForBatchSlot, prepareBriefForBatch } = require("./brandCampaignConceptSlots.cjs");
const {
  buildBrandCampaignImagePrompt,
  getBrandCampaignPerImageCost,
  clampOutputCount,
} = require("./index.cjs");

/** Stay under Vercel 800s function limit (analyze + multipart overhead). */
const BATCH_WALL_MS = 720_000;

function parseBriefField(briefRaw) {
  if (!briefRaw) return null;
  try {
    return typeof briefRaw === "string" ? JSON.parse(briefRaw) : briefRaw;
  } catch {
    return null;
  }
}

function resolveBrandImageUrls(uploadedUrls, brief) {
  const briefRefs = Array.isArray(brief?.reference_image_urls) ? brief.reference_image_urls : [];
  if (uploadedUrls?.length) return uploadedUrls.slice(0, 4);
  return briefRefs.filter((u) => String(u).startsWith("http")).slice(0, 4);
}

function buildBrandCampaignSubmission({
  brief,
  concept,
  batchSlotIndex,
  aspectRatio,
  imageUrls,
  CREDIT,
  finalizeImagePrompt,
  appendAspectOutputInstruction,
  stylePreset = null,
  batchTotal = 1,
  batchId = null,
}) {
  if (!concept?.prompt) {
    const err = new Error(`Concepto de anúncio ${batchSlotIndex + 1} em falta.`);
    err.status = 400;
    throw err;
  }

  const photoRef = imageUrls[0] || null;
  const extraRefs = imageUrls.slice(1, 4);

  let prompt = buildBrandCampaignImagePrompt({
    brief,
    concept,
    aspectRatio,
    stylePreset,
    batchSlot: batchSlotIndex,
    batchTotal,
  });
  prompt = finalizeImagePrompt(prompt, {
    modelKey: "pro",
    poster: true,
    hasPersonPhoto: false,
    photoEdit: false,
  });
  prompt = appendAspectOutputInstruction(prompt, aspectRatio);

  const perImage = getBrandCampaignPerImageCost(CREDIT);
  const resolved = resolvePosterModel("nano_banana");

  // Slot 0: todas as refs (produto fiel). Slots 1+: só texto (sem img2img = composições diferentes).
  const useTextOnly = batchTotal > 1 && batchSlotIndex > 0;
  const slotPhoto = useTextOnly ? null : (imageUrls[batchSlotIndex % Math.max(imageUrls.length, 1)] || photoRef);

  const nbInput = buildNanoBananaPosterInput({
    prompt,
    aspectRatio,
    photoRef: slotPhoto,
    garmentRef: !useTextOnly && extraRefs[0] ? extraRefs[0] : null,
  });

  if (!useTextOnly && imageUrls.length > 1) {
    nbInput.image_input = imageUrls.slice(0, 4);
  }

  return {
    cost: perImage,
    type: "poster",
    modelId: resolved.modelId,
    input: nbInput,
    prompt,
    aspectRatio: nbInput.aspect_ratio || aspectRatio,
    modelUsed: "Campanha on-brand · Nano Banana",
    spendDescription: `Campanha on-brand · ${concept.title || `Ad ${batchSlotIndex + 1}`}`,
    pendingMeta: {
      brand_campaign_index: batchSlotIndex,
      brand_campaign_title: concept.title || "",
      brand_name: brief.brand_name || "",
      brand_campaign_batch_total: batchTotal,
      brand_campaign_batch_id: batchId || null,
      ad_style_id: stylePreset?.id || null,
      ad_style_label: stylePreset?.label || null,
    },
    conceptTitle: stylePreset?.label
      ? `${concept.title || `Ad ${batchSlotIndex + 1}`} · ${stylePreset.label}`
      : (concept.title || `Ad ${batchSlotIndex + 1}`),
  };
}

async function waitForPendingComplete(pendingId, getPrediction, { timeoutMs = 600000 } = {}) {
  const start = Date.now();
  let missingRetries = 0;

  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const pending = await getPending(pendingId);
    if (!pending) {
      missingRetries += 1;
      if (missingRetries > 60) {
        const err = new Error("Geração não encontrada — tenta outra vez ou vê a Galeria.");
        err.status = 404;
        throw err;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await pollPending(pending, getPrediction);
    if (result.status === "succeeded") return result;
    if (result.status === "failed") {
      const err = new Error(result.error || "Geração falhou.");
      err.refunded = result.refunded;
      err.new_balance = result.new_balance;
      throw err;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 2500));
  }

  const err = new Error("Timeout — a imagem pode ainda estar a gerar. Verifica a Galeria.");
  err.status = 504;
  throw err;
}

function isPollDeferError(err) {
  if (!err) return false;
  if (err.status === 504) return true;
  return /timeout|tempo esgotado|ainda estar a gerar|Geração não encontrada/i.test(String(err.message || ""));
}

async function runBrandCampaignBatch({
  req,
  fields,
  files,
  CREDIT,
  deps,
}) {
  const {
    text,
    resolveMarketingVideoImages,
    submitBillableGeneration,
    getPrediction,
    normalizeRatio,
    finalizeImagePrompt,
    appendAspectOutputInstruction,
  } = deps;

  const briefRaw = parseBriefField(text(fields, "brief", ""));
  const outputCount = clampOutputCount(text(fields, "output_count", text(fields, "count", 1)));
  const brief = prepareBriefForBatch(briefRaw, outputCount);
  if (!brief?.concepts?.length) {
    const err = new Error("Brief de marca inválido — analisa de novo.");
    err.status = 400;
    throw err;
  }
  const aspectRatio = normalizeRatio(text(fields, "aspect_ratio", "4:5"), "standard");
  const uploadedUrls = await resolveMarketingVideoImages(files, fields, 5);
  const imageUrls = resolveBrandImageUrls(uploadedUrls, brief);
  const styleCategory = resolveCategoryId(text(fields, "style_category", "general"));
  const stylePresetId = String(text(fields, "style_preset", "auto") || "auto").trim() || "auto";
  const lang = String(text(fields, "lang", "pt") || "pt").slice(0, 2);

  const batchStart = Date.now();
  const remainingMs = () => Math.max(0, BATCH_WALL_MS - (Date.now() - batchStart));

  const batchId = crypto.randomUUID().slice(0, 8);
  const jobs = [];
  const submitErrors = [];
  let creditsSpent = 0;

  // Phase 1 — submit ALL ads immediately (each triggers scheduleServerPendingPoll).
  for (let i = 0; i < outputCount; i += 1) {
    try {
      const stylePreset = pickBrandCampaignPreset({
        categoryId: styleCategory,
        presetId: stylePresetId,
        conceptIndex: i,
        lang,
      });

      const concept = resolveConceptForBatchSlot(brief, i, outputCount);

      const submission = buildBrandCampaignSubmission({
        brief,
        concept,
        batchSlotIndex: i,
        aspectRatio,
        imageUrls,
        CREDIT,
        finalizeImagePrompt,
        appendAspectOutputInstruction,
        stylePreset,
        batchTotal: outputCount,
        batchId,
      });

      // eslint-disable-next-line no-await-in-loop
      const submitted = await submitBillableGeneration(req, fields, submission);
      creditsSpent += Number(submitted?.credits_spent) || 0;

      jobs.push({
        concept_index: i,
        prediction_id: submitted.prediction_id,
        title: submission.conceptTitle,
        credits_spent: submitted.credits_spent || submission.cost,
      });
    } catch (err) {
      submitErrors.push({
        concept_index: i,
        title: brief.concepts?.[i]?.title || `Ad ${i + 1}`,
        error: err.message || "Erro ao iniciar geração",
      });
    }
  }

  const results = [];
  const errors = [...submitErrors];
  const pending = [];

  // Phase 2 — poll each submitted job within remaining wall time.
  for (const job of jobs) {
    const budget = remainingMs();
    if (budget < 8000) {
      pending.push({
        concept_index: job.concept_index,
        prediction_id: job.prediction_id,
        title: job.title,
        credits_spent: job.credits_spent,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const done = await waitForPendingComplete(job.prediction_id, getPrediction, {
        timeoutMs: Math.min(budget - 2000, 600_000),
      });
      const url = done?.creation?.result_urls?.[0];
      if (!url) {
        throw new Error(`Anúncio ${job.concept_index + 1} concluiu sem ficheiro.`);
      }

      results.push({
        url,
        title: job.title,
        concept_index: job.concept_index,
        creation_id: done.creation?.id || job.prediction_id,
        prediction_id: job.prediction_id,
        credits_spent: job.credits_spent,
        creation: done.creation || null,
      });
    } catch (err) {
      if (isPollDeferError(err)) {
        pending.push({
          concept_index: job.concept_index,
          prediction_id: job.prediction_id,
          title: job.title,
          credits_spent: job.credits_spent,
        });
      } else {
        errors.push({
          concept_index: job.concept_index,
          title: job.title,
          error: err.message || "Erro desconhecido",
        });
      }
    }
  }

  return {
    results,
    errors,
    pending,
    credits_spent: creditsSpent,
    requested: outputCount,
    completed: results.length,
    still_processing: pending.length,
  };
}

module.exports = {
  runBrandCampaignBatch,
  waitForPendingComplete,
  parseBriefField,
  buildBrandCampaignSubmission,
};
