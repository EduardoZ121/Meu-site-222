import { useEffect, useRef } from "react";

const LINES = [
  "Carrega a tua foto.",
  "Define o mood.",
  "Remake Pixel transforma um frame",
  "em campanhas premium,",
  "pôsteres, vídeos e visuais IA",
  "prontos para publicar.",
];

export default function QuoteBlock() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const spans = Array.from(root.querySelectorAll(".reveal-text span"));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        spans.forEach((span, index) => {
          window.setTimeout(() => span.classList.add("visible"), 140 * index);
        });
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="hero-section" data-testid="quote-section">
      <p className="tagline">MOTOR CRIATIVO COM IA</p>
      <h1 className="reveal-text">
        {LINES.map((line) => (
          <span key={line} className={line === "em campanhas premium," ? "highlight" : undefined}>
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
