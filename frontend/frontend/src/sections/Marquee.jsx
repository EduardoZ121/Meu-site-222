const text = "BEGIN FREE · 50 CREDITS · NO CARD REQUIRED · 33 STYLES · 44 POSTERS · 6S VIDEOS · GROK IMAGINE · FLUX 2 KLEIN · GPT IMAGE 1 · COMMERCIAL RIGHTS · CANCEL ANYTIME · PORTUGUÊS · ENGLISH · ESPAÑOL · FRANÇAIS · ";

export default function Marquee() {
  return (
    <section className="relative bg-rp-bg border-y border-rp-border py-10 overflow-hidden" data-testid="marquee">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="font-heading italic text-2xl md:text-4xl text-rp-text/30 uppercase tracking-[0.15em] mx-8 leading-none">
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
