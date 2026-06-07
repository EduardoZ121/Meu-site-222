import StyleCover from "../StyleCover";
import { getArtisticStyleBadge } from "../../lib/artisticStyleBadges";
import { ARTISTIC_STYLE_COVER_BY_ID } from "../../lib/artisticStyleCovers";
import { useI18n } from "../../lib/i18n";

const BADGE_KEYS = {
  popular: "art_badge_popular",
  new: "art_badge_new",
  pro: "art_badge_pro",
  experimental: "art_badge_experimental",
};

export default function ArtisticStyleGrid({ styles, selectedId, onSelect, categoryLabel = "" }) {
  const { t } = useI18n();

  if (!styles.length) {
    return (
      <p className="as-v2-soon-note">{t("art_empty")}</p>
    );
  }

  return (
    <div className="as-v2-style-grid" data-testid="artistic-style-grid">
      {styles.map((style) => {
        const active = selectedId === style.id;
        const badge = getArtisticStyleBadge(style);
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style.id)}
            className={`as-v2-style-card ${active ? "as-v2-style-card--active" : ""}`}
            data-testid={`artistic-style-${style.id}`}
          >
            <StyleCover
              id={style.id}
              title={style.label}
              prompt={style.suffix || style.desc || ""}
              category={style.cat}
              eyebrow={categoryLabel}
              selected={active}
              compact
              coverSrc={ARTISTIC_STYLE_COVER_BY_ID[style.id] || ""}
              className="as-v2-style-card__cover"
            />
            <div className="as-v2-style-card__meta">
              <p className="as-v2-style-card__title">{style.label}</p>
              {style.desc ? <p className="as-v2-style-card__desc">{style.desc}</p> : null}
              {badge ? (
                <span className={`as-v2-style-badge as-v2-style-badge--${badge}`}>
                  {t(BADGE_KEYS[badge])}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
