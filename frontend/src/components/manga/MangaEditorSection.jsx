import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/** Secção colapsável do Editor (montagem). */
export default function MangaEditorSection({
  title,
  hint,
  defaultOpen = true,
  children,
  badge,
}) {
  return (
    <details className="manga-editor-section group" open={defaultOpen}>
      <summary className="manga-editor-section__head">
        <span className="flex items-center gap-2 min-w-0">
          <span className="manga-editor-section__title truncate">{title}</span>
          {badge ? (
            <span className="manga-editor-section__badge shrink-0">{badge}</span>
          ) : null}
        </span>
        <ChevronDown className="w-4 h-4 text-[#5A5A5E] shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      {hint ? <p className="manga-editor-section__hint">{hint}</p> : null}
      <div className={cn("manga-editor-section__body space-y-2.5", hint && "pt-0")}>
        {children}
      </div>
    </details>
  );
}
