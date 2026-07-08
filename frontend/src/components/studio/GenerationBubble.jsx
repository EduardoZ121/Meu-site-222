import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Images, X, Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { primaryResultUrl, normalizeCreation } from "../../lib/creationUrls";
import ResultPanel from "../ResultPanel";

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
 * Bolha flutuante de geração — arrastável (estilo Messenger), com animação suave.
 */
export default function GenerationBubble({ busy, progress = 0, result, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [pos, setPos] = useState(() => readSavedPos() || { x: MARGIN, y: null });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0, pointerId: null });

  useEffect(() => {
    if (busy) {
      setDismissed(false);
      setOpen(true);
    }
  }, [busy]);

  const resultId = result?.id || primaryResultUrl(result) || null;
  useEffect(() => {
    if (resultId) setDismissed(false);
  }, [resultId]);

  const clampPos = useCallback((x, y) => {
    const maxX = Math.max(MARGIN, window.innerWidth - BUBBLE - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - BUBBLE - MARGIN);
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
    sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
  }, [pos]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
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
    if (!d.moved) setOpen((v) => !v);
    dragRef.current.moved = false;
  };

  const active = !dismissed && (busy || Boolean(resultId));
  if (!active) return null;

  const normalized = result ? normalizeCreation(result) : null;
  const thumb = normalized ? primaryResultUrl(normalized) : null;
  const galleryUrl = normalized?.id
    ? `/app/gallery?focus=${encodeURIComponent(normalized.id)}`
    : "/app/gallery";

  const docked = !open;
  const panelLeft = Math.min(Math.max(pos.x, MARGIN), window.innerWidth - 340);
  const panelTop = Math.min(Math.max(pos.y - 20, MARGIN), window.innerHeight - 280);

  return (
    <>
      <div
        className={`rp-gen-bubble-wrap ${docked ? "rp-gen-bubble-wrap--docked" : ""} ${dragging ? "rp-gen-bubble-wrap--dragging" : ""}`}
        style={{ left: pos.x, top: pos.y ?? "50%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="button"
        tabIndex={0}
        aria-label={t("res_loading_title") || "Geração"}
        data-testid="generation-bubble"
      >
        <div className={`rp-gen-bubble ${docked ? "rp-gen-bubble--docked" : ""}`}>
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
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="rp-gen-panel"
            style={{ left: panelLeft, top: panelTop }}
            data-testid="generation-bubble-panel"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C4B5FD]">
                {busy ? (progress > 0 ? t("studio_generating", { n: progress }) : t("res_loading_title")) : t("last_result")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8A8A8E] hover:text-white hover:bg-white/[0.06]"
                aria-label={t("close") || "Fechar"}
                data-testid="generation-bubble-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ResultPanel creation={result} loading={busy} onChange={onChange} emptyLabel={t("studio_result_next")} />

            <Link
              to={galleryUrl}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-[#9333EA]/30 bg-[#9333EA]/10 px-3 py-2 text-[12px] font-medium text-[#C4B5FD] hover:bg-[#9333EA]/20 transition-colors"
              data-testid="generation-bubble-gallery"
            >
              <Images className="w-3.5 h-3.5" /> {t("sidebar_gallery")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
