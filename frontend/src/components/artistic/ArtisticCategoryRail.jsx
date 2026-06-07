import { motion } from "framer-motion";
import { getCategoryMeta } from "../../lib/artisticCategoryMeta";
import { countStylesInCategory } from "../../lib/artisticStudioLocales";

export default function ArtisticCategoryRail({
  categories,
  styles,
  activeId,
  onSelect,
}) {
  return (
    <div className="art-studio-cat-rail" data-testid="artistic-category-rail">
      {categories.map((c) => {
        const meta = getCategoryMeta(c.id);
        const Icon = meta.icon;
        const active = activeId === c.id;
        const n = countStylesInCategory(styles, c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`art-studio-cat-chip ${active ? "art-studio-cat-chip--active" : ""} ${
              c.adminOnly ? "art-studio-cat-chip--admin" : ""
            }`}
            data-testid={`art-cat-${c.id}`}
          >
            <span className="art-studio-cat-chip__emoji" aria-hidden>
              {meta.emoji}
            </span>
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            <span className="flex flex-col items-start leading-tight min-w-0">
              <span className="truncate max-w-[120px] sm:max-w-none">{c.label}</span>
              <span className="text-[9px] opacity-60 tabular-nums">{n}</span>
            </span>
            {active && (
              <motion.span
                layoutId="art-cat-underline"
                className="art-studio-cat-chip__active-bar"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
