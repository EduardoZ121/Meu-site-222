import { useEffect, useRef } from "react";

const lines = [
  "Carrega a tua foto.",
  "Define o mood.",
  "Remake Pixel transforma um frame",
  "em campanhas premium,",
  "pôsteres, vídeos e visuais IA",
  "prontos para publicar.",
];

const highlightLine = "campanhas premium,";

export default function QuoteBlock() {
  const ref = useRef(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return undefined;
    const spans = Array.from(section.querySelectorAll(".reveal-text span"));

    const reveal = () => {
      spans.forEach((span, index) => {
        window.setTimeout(() => span.classList.add("visible"), index * 140);
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="hero-section"
      data-testid="quote-section"
    >
      <div className="tagline">MOTOR CRIATIVO COM IA</div>

      <h1 className="reveal-text">
        {lines.map((line) => (
          <span key={line} className={line === highlightLine ? "highlight" : undefined}>
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
