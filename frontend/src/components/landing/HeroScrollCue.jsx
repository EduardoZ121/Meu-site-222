import { useI18n } from "../../lib/i18n";

export default function HeroScrollCue() {
  const { t } = useI18n();

  const scrollDown = () => {
    const next = document.getElementById("home-next");
    if (next) {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollDown}
      className="hero-scroll-cue group"
      aria-label={t("hero_scroll")}
      data-testid="hero-scroll-cue"
    >
      <span className="hero-scroll-cue__ring" aria-hidden />
      <span className="hero-scroll-cue__line" aria-hidden>
        <span className="hero-scroll-cue__pulse" />
      </span>
      <span className="hero-scroll-cue__chevrons" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="hero-scroll-cue__label">{t("hero_scroll")}</span>
    </button>
  );
}
