import { motion } from "framer-motion";
import { getCategoryMeta } from "../../lib/artisticCategoryMeta";
import { countStylesInCategory } from "../../lib/artisticStudioLocales";

/** Lista vertical de categorias (estilo mockup / mega-lens). */
export default function ArtisticCategorySidebar({
  categories,
  styles,
  activeId,
  onSelect,
}) {
  return (
    <nav
      className="art-studio-cat-sidebar"
      aria-label="Categorias de estilo"
      data-testid="artistic-category-sidebar"
    >
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
            className={`art-studio-cat-sidebar__item ${active ? "art-studio-cat-sidebar__item--active" : ""} ${
              c.adminOnly ? "art-studio-cat-sidebar__item--admin" : ""
            }`}
            data-testid={`art-cat-${c.id}`}
          >
            {active && (
              <motion.span
                layoutId="art-cat-sidebar-indicator"
                className="art-studio-cat-sidebar__indicator"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="art-studio-cat-sidebar__emoji" aria-hidden>
              {meta.emoji}
            </span>
            <span className="art-studio-cat-sidebar__body">
              <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" strokeWidth={1.75} />
              <span className="art-studio-cat-sidebar__label">{c.label}</span>
              <span className="art-studio-cat-sidebar__count">{n}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
