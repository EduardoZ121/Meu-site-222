import { BookOpen, Layers, Sparkles, Check, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";

const STEPS = [
  { id: "library", icon: BookOpen, labelKey: "manga_tab_library", step: 1 },
  { id: "editor", icon: Layers, labelKey: "manga_tab_editor", step: 2 },
  { id: "config", icon: Sparkles, labelKey: "manga_tab_panel", step: 3 },
];

export default function MangaWorkflowBar({
  activeTab,
  onTabChange,
  libraryOk,
  editorOk,
  panelOk,
  dirty,
}) {
  const { t } = useI18n();

  const status = {
    library: libraryOk,
    editor: editorOk,
    config: panelOk,
  };

  return (
    <div className="manga-workflow mb-4" data-testid="manga-workflow">
      <p className="manga-workflow__intro">{t("manga_workflow_intro")}</p>
      <div className="manga-workflow__track">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const active = activeTab === step.id;
          const done = status[step.id];
          return (
            <div key={step.id} className="manga-workflow__item-wrap">
              {i > 0 && <span className="manga-workflow__arrow" aria-hidden>→</span>}
              <button
                type="button"
                onClick={() => onTabChange(step.id)}
                className={cn(
                  "manga-workflow__step",
                  active && "manga-workflow__step--active",
                  done && "manga-workflow__step--done",
                )}
              >
                <span className="manga-workflow__num">{step.step}</span>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="manga-workflow__label">{t(step.labelKey)}</span>
                {done ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : active ? (
                  <span className="manga-workflow__dot" />
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
      {dirty && (
        <p className="manga-workflow__warn flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {t("manga_workflow_dirty")}
        </p>
      )}
    </div>
  );
}
