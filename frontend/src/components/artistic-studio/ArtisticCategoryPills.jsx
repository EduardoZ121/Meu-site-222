export default function ArtisticCategoryPills({ categories, activeId, onSelect, counts = {} }) {
  return (
    <div className="as-v2-cat-rail" data-testid="artistic-categories">
      {categories.map((cat) => {
        const active = activeId === cat.id;
        const count = counts[cat.id] ?? 0;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`as-v2-cat-pill ${active ? "as-v2-cat-pill--active" : ""} ${cat.labCategory ? "as-v2-cat-pill--lab" : ""}`}
            data-testid={`artistic-cat-${cat.id}`}
          >
            <span>{cat.label}</span>
            {count > 0 ? <em>{count}</em> : null}
          </button>
        );
      })}
    </div>
  );
}
