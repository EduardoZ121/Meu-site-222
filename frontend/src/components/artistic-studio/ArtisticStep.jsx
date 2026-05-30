export default function ArtisticStep({ step, title, hint, children }) {
  return (
    <section className="as-v2-step border-b border-white/[0.05] pb-7 last:border-0 last:pb-0">
      <div className="flex gap-3.5 mb-4">
        <span className="as-v2-step-num" aria-hidden>{step}</span>
        <div className="min-w-0 pt-0.5">
          <h2 className="as-v2-step-title">{title}</h2>
          {hint ? <p className="as-v2-step-hint">{hint}</p> : null}
        </div>
      </div>
      <div className="as-v2-step-body">{children}</div>
    </section>
  );
}
