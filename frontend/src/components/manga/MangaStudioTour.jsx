import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const TOUR_KEY = "rp_manga_tour_v2_done";

export function isTourDone() {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTourDone() {
  try {
    localStorage.setItem(TOUR_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function MangaStudioTour({ open, onClose, onFinish }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const steps = [
    { title: t("manga_tour_1_title"), body: t("manga_tour_1_body") },
    { title: t("manga_tour_2_title"), body: t("manga_tour_2_body") },
    { title: t("manga_tour_3_title"), body: t("manga_tour_3_body") },
    { title: t("manga_tour_4_title"), body: t("manga_tour_4_body") },
    { title: t("manga_tour_5_title"), body: t("manga_tour_5_body") },
  ];

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const finish = () => {
    markTourDone();
    onFinish?.();
    onClose();
  };

  const s = steps[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="max-w-md w-full rounded-2xl border border-[#A855F7]/50 bg-[#111118] p-6 shadow-[0_0_40px_rgba(147,51,234,0.25)]">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-mono text-[#A855F7] uppercase tracking-widest">
            {t("manga_tour_label")} {step + 1}/{steps.length}
          </span>
          <button type="button" onClick={finish} className="text-[#5A5A5E] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-white text-lg font-light mb-2">{s.title}</h3>
        <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">{s.body}</p>
        <div className="flex justify-between gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((x) => Math.max(0, x - 1))}
            className="manga-chip-btn disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((x) => x + 1)}
              className="manga-generate-btn flex-1 justify-center"
            >
              {t("manga_tour_next")} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={finish} className="manga-generate-btn flex-1 justify-center">
              {t("manga_tour_finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
