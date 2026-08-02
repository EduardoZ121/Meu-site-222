import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Images, X, Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { primaryResultUrl, normalizeCreation } from "../../lib/creationUrls";
import { seedGalleryFocus } from "../../lib/galleryCache";
import {
  useGenerationBubble,
  useGenerationBubbleOptional,
} from "../../lib/GenerationBubbleContext";

const POS_KEY = "rp-gen-bubble-pos";
const BUBBLE = 52;
const MARGIN = 8;

function readSavedPos() {
  try {
    const raw = sessionStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) return p;
  } catch { /* ignore */ }
  return null;
}

/**
 * Shell-level portal — mounted once in Dashboard Layout.
 * Survives studio route changes; only clears on bubble click or X.
 */
export function GenerationBubbleHost() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { busy, progress, result, dismiss } = useGenerationBubble();
  const [pos, setPos] = useState(() => readSavedPos() || { x: MARGIN, y: null });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({
    active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0, pointerId: null,
  });

  const effectiveResult = result || null;
  const resultId = effectiveResult?.id || primaryResultUrl(effectiveResult) || null;

  const clampPos = useCallback((x, y) => {
    const maxX = Math.max(MARGIN, window.innerWidth - BUBBLE - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - BUBBLE - 40 - MARGIN);
    return {
      x: Math.min(maxX, Math.max(MARGIN, x)),
      y: Math.min(maxY, Math.max(MARGIN, y)),
    };
  }, []);

  useEffect(() => {
    if (pos.y != null) return;
    const y = Math.round(window.innerHeight * 0.5 - BUBBLE / 2);
    setPos((p) => clampPos(p.x, y));
  }, [pos.y, clampPos]);

  useEffect(() => {
    if (pos.y == null) return;
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch { /* ignore */ }
  }, [pos]);

  const openGallery = useCallback(() => {
    const normalized = effectiveResult ? normalizeCreation(effectiveResult) : null;
    if (normalized) seedGalleryFocus(normalized);
    dismiss();
    const galleryUrl = normalized?.id
      ? `/app/gallery?focus=${encodeURIComponent(normalized.id)}`
      : "/app/gallery";
    navigate(galleryUrl);
  }, [navigate, effectiveResult, dismiss]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.("[data-bubble-dismiss]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      pointerId: e.pointerId,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    setPos(clampPos(d.originX + dx, d.originY + dy));
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(d.pointerId); } catch { /* ignore */ }
    if (!d.moved && !e.target?.closest?.("[data-bubble-dismiss]")) {
      openGallery();
    }
    dragRef.current.moved = false;
  };

  const onDismiss = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    dismiss();
  };

  // Busy always wins; ready stays until Galeria or X (not auto-hidden).
  const active = busy || Boolean(resultId);
  if (!active || typeof document === "undefined") return null;

  const normalized = effectiveResult ? normalizeCreation(effectiveResult) : null;
  const thumb = normalized ? primaryResultUrl(normalized) : null;
  void progress;

  return createPortal(
    <div
      className={`rp-gen-bubble-wrap ${dragging ? "rp-gen-bubble-wrap--dragging" : ""}`}
      style={{ left: pos.x, top: pos.y ?? "50%" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      tabIndex={0}
      aria-label={busy ? (t("res_loading_title") || "A gerar…") : (t("sidebar_gallery") || "Galeria")}
      data-testid="generation-bubble"
      title={busy ? (t("res_loading_title") || "A gerar…") : (t("sidebar_gallery") || "Abrir galeria")}
    >
      <div className="rp-gen-bubble">
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover rounded-full" />
        ) : (
          <Images className="w-5 h-5 text-white" />
        )}
        {busy && <span className="rp-gen-bubble__pulse" aria-hidden />}
        {!busy && thumb && <span className="rp-gen-bubble__dot" aria-hidden />}
      </div>
      <button
        type="button"
        data-bubble-dismiss=""
        onClick={onDismiss}
        onPointerDown={(e) => e.stopPropagation()}
        className="rp-gen-bubble__dismiss"
        aria-label={t("close") || "Fechar"}
        data-testid="generation-bubble-dismiss"
        title={t("close") || "Fechar"}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.25} />
      </button>
    </div>,
    document.body,
  );
}

/**
 * Page-level sync — reports busy/result into the shell context.
 * Renders nothing; the portal lives in Dashboard Layout.
 * Unmount on navigation does NOT clear the bubble.
 * Idle mounts (busy=false, no result) must not wipe a shell bubble from another session.
 */
export default function GenerationBubble({ busy, progress = 0, result, onChange }) {
  const ctx = useGenerationBubbleOptional();
  const report = ctx?.report;
  const wasBusyRef = useRef(false);

  useEffect(() => {
    if (!report) return undefined;

    if (busy) {
      wasBusyRef.current = true;
      report({
        busy: true,
        progress,
        result: result || null,
        onChange,
      });
      return undefined;
    }

    if (result) {
      wasBusyRef.current = false;
      report({
        busy: false,
        progress,
        result,
        onChange,
      });
      return undefined;
    }

    // Local busy ended without a result (error / cancelled) — clear spinner only.
    if (wasBusyRef.current) {
      wasBusyRef.current = false;
      report({
        busy: false,
        progress,
        result: null,
        onChange,
      });
    }

    return undefined;
  }, [busy, progress, result, onChange, report]);

  return null;
}
