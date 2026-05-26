import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Botão de idioma fixo no canto superior direito — páginas públicas e login (não no dashboard).
 */
export default function PublicLanguageBar({ testId = "public-lang-bar" }) {
  return (
    <div
      className="fixed top-0 right-0 z-[60] flex items-center justify-end pointer-events-none pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]"
      data-testid={testId}
    >
      <div className="pointer-events-auto">
        <LanguageSwitcher testId={`${testId}-switcher`} />
      </div>
    </div>
  );
}
