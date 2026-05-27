/** Bloco fixo por passo no estúdio de vídeo (sem accordion — sempre visível). */
export default function VideoStudioSection({ title, children, testId, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-[#2E2E30] bg-[#13131A]/40 p-5 sm:p-6 ${className}`.trim()}
      data-testid={testId}
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">{title}</p>
      {children}
    </section>
  );
}
