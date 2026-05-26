import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

const STORAGE_KEY = "rp_artistic_recipe_bubble_pos";

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Bolha flutuante arrastável — receita visual sem bloquear a UI.
 */
export default function DraggableRecipeBubble({ chips, onClearAll }) {
  const bubbleRef = useRef(null);
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });
  const [pos, setPos] = useState(() => {
    const saved = loadPosition();
    if (saved) return saved;
    if (typeof window !== "undefined") {
      return { x: window.innerWidth / 2 - 140, y: window.innerHeight - 120 };
    }
    return { x: 24, y: 400 };
  });
  const [dragging, setDragging] = useState(false);

  const placeDefault = useCallback(() => {
    const w = bubbleRef.current?.offsetWidth ?? 280;
    const h = bubbleRef.current?.offsetHeight ?? 72;
    setPos({
      x: clamp(window.innerWidth / 2 - w / 2, 8, window.innerWidth - w - 8),
      y: clamp(window.innerHeight - h - 88, 8, window.innerHeight - h - 8),
    });
  }, []);

  useEffect(() => {
    if (!loadPosition()) placeDefault();
    const onResize = () => {
      setPos((p) => {
        const w = bubbleRef.current?.offsetWidth ?? 280;
        const h = bubbleRef.current?.offsetHeight ?? 72;
        return {
          x: clamp(p.x, 8, window.innerWidth - w - 8),
          y: clamp(p.y, 8, window.innerHeight - h - 8),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [placeDefault]);

  useEffect(() => {
    if (!dragging) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
      } catch {
        /* ignore */
      }
    }
  }, [pos, dragging]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const el = bubbleRef.current;
    if (!el) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
      pointerId: e.pointerId,
    };
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const w = bubbleRef.current?.offsetWidth ?? 280;
    const h = bubbleRef.current?.offsetHeight ?? 72;
    setPos({
      x: clamp(e.clientX - dragRef.current.offsetX, 8, window.innerWidth - w - 8),
      y: clamp(e.clientY - dragRef.current.offsetY, 8, window.innerHeight - h - 8),
    });
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    bubbleRef.current?.releasePointerCapture(e.pointerId);
  };

  if (!chips?.length) return null;

  return (
    <div
      ref={bubbleRef}
      role="dialog"
      aria-label="Receita visual"
      className={`fixed z-[60] max-w-[min(92vw,320px)] touch-none select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        transition: dragging ? "none" : "box-shadow 0.2s ease",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-testid="artistic-recipe-bubble"
    >
      <div
        className={`rounded-2xl border border-[rgba(147,51,234,0.45)] bg-[#111118]/96 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(147,51,234,0.2)] ${
          dragging ? "shadow-[0_12px_40px_rgba(147,51,234,0.35)] scale-[1.02]" : ""
        }`}
      >
        <div
          className="flex items-center gap-1 px-2 py-1.5 border-b border-[rgba(147,51,234,0.2)] text-[#9CA3AF]"
          onPointerDown={onPointerDown}
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0 text-[#6B7280]" />
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] flex-1">
            Receita · arrasta
          </span>
        </div>
        <div className="px-3 py-2.5 flex flex-wrap items-center gap-1.5 max-h-[140px] overflow-y-auto">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#9333EA]/20 border border-[rgba(147,51,234,0.35)] text-[10px] text-white"
            >
              <span className="text-[11px]">{chip.emoji}</span>
              <span className="truncate max-w-[100px]">{chip.label}</span>
            </span>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearAll?.();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[9px] text-[#06B6D4] hover:underline ml-auto shrink-0"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

