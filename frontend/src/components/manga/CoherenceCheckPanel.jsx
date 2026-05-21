import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";

export default function CoherenceCheckPanel({ open, onClose, score, warnings, onJumpToPanel }) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" role="dialog">
      <div className="w-full max-w-md rounded-2xl border border-[#9333EA]/40 bg-[#111118] shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E30]">
          <h3 className="text-white font-medium text-sm">{t("manga_coherence_title")}</h3>
          <button type="button" onClick={onClose} className="text-[#5A5A5E] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                "text-2xl font-light",
                score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-300" : "text-red-400",
              )}
            >
              {score}%
            </div>
            <p className="text-[11px] text-[#9CA3AF]">{t("manga_coherence_score_desc")}</p>
          </div>
          {warnings.length === 0 ? (
            <p className="flex items-center gap-2 text-green-400/90 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {t("manga_coherence_ok")}
            </p>
          ) : (
            <ul className="space-y-2 overflow-y-auto max-h-[50vh]">
              {warnings.map((w) => (
                <li
                  key={w.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[11px]",
                    w.severity === "error"
                      ? "border-red-500/40 bg-red-500/10 text-red-100"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-100",
                  )}
                >
                  <div className="flex gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p>{w.message}</p>
                      {w.fix && <p className="text-[#9CA3AF] mt-1">{w.fix}</p>}
                      {w.panelId && onJumpToPanel && (
                        <button
                          type="button"
                          className="text-[#A855F7] mt-1 underline"
                          onClick={() => {
                            onJumpToPanel(w.panelId);
                            onClose();
                          }}
                        >
                          {t("manga_go_panel")}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
