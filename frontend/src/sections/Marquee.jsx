const text = "START FREE · 30 CREDITS · NO CARD REQUIRED · 96 STYLES · 44 POSTERS · 6S VIDEOS · GROK IMAGINE · FLUX 2 KLEIN · GPT IMAGE 1 · COMMERCIAL RIGHTS · CANCEL ANYTIME · ENGLISH · PORTUGUÊS · ESPAÑOL · FRANÇAIS · ";

export default function Marquee() {
  return (
    <section className="relative bg-[#7C3AED] py-2.5 overflow-hidden" data-testid="marquee-section">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="text-[#F4F1EA] text-[10px] font-mono font-medium uppercase tracking-[0.12em] mx-1">{text}</span>
        ))}
      </div>
    </section>
  );
}
