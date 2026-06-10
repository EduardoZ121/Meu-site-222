import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

/**
 * CompactStudioShell — OpenArt-inspired compact editor layout.
 *
 * Visual rules (apply to Posters, Easy, Pro, Artistic):
 *  - Sticky compact header: only "< Title" (no eyebrow / no hero)
 *  - Body: max-w-[720px] mx-auto, dense padding, scrollable
 *  - Spacing between sections halved (gap-3 instead of gap-6)
 *  - Sticky bottom action bar with gradient Generate button
 *
 * Children are the actual editor content (each page provides its sections).
 */
export default function CompactStudioShell({
  title,
  onBack,
  rightSlot,
  children,
  ctaLabel,
  ctaCredits,
  ctaIcon = <Sparkles className="w-4 h-4" />,
  ctaDisabled = false,
  ctaLoading = false,
  onCta,
  secondaryCta,           // { label, credits, onClick, disabled }
  backTo,                 // string fallback (router push)
}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return navigate(backTo);
    navigate(-1);
  };

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        maxWidth: 720,
        paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
      }}
      data-testid="compact-studio-shell"
    >
      {/* Sticky compact header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md bg-[#0B0B0C]/85 border-b border-[#1F1F23]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Back"
            data-testid="shell-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-[17px] font-semibold font-['Inter_Tight'] truncate flex-1">
            {title}
          </h1>
          {rightSlot}
        </div>
      </header>

      {/* Body */}
      <div className="px-4 pt-3 space-y-3" data-testid="shell-body">
        {children}
      </div>

      {/* Sticky bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-[#0B0B0C]/92 border-t border-[#1F1F23]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        <div
          className="mx-auto flex items-center gap-2 px-4 pt-3"
          style={{ maxWidth: 720 }}
        >
          {secondaryCta && (
            <button
              type="button"
              onClick={secondaryCta.onClick}
              disabled={secondaryCta.disabled}
              className="flex-1 py-3 px-3 rounded-xl bg-[#16161A] border border-[#2E2E30] text-white text-[13px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-[#1F1F23] transition-colors"
              data-testid="shell-secondary-cta"
            >
              <span className="truncate">{secondaryCta.label}</span>
              {secondaryCta.credits != null && (
                <span className="inline-flex items-center gap-1 text-[#A78BFA]">
                  <Sparkles className="w-3.5 h-3.5" />
                  {secondaryCta.credits}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onCta}
            disabled={ctaDisabled || ctaLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-[0_8px_30px_-6px_rgba(124,58,237,0.55)] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            data-testid="shell-primary-cta"
          >
            {ctaLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              ctaIcon
            )}
            <span className="truncate">{ctaLabel}</span>
            {ctaCredits != null && (
              <span className="inline-flex items-center gap-1 text-white/90">
                · {ctaCredits}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ChipRow — pair of small settings chips (Format · Output style) */
export function ChipRow({ children }) {
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="chip-row">
      {children}
    </div>
  );
}

/** SettingChip — compact button-style chip for settings (Aspect / Output / Quality) */
export function SettingChip({ icon, label, value, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-[#16161A] border border-[#2E2E30] rounded-xl px-3 py-2.5 flex items-center gap-2.5 hover:border-[#7C3AED]/40 transition-colors text-left"
      data-testid={testId}
    >
      {icon && <span className="text-[#9CA3AF] shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] leading-tight truncate">
          {label}
        </div>
        <div className="text-white text-[13px] font-semibold leading-tight truncate">
          {value}
        </div>
      </div>
      <span className="text-[#5A5A5E] text-xs shrink-0">›</span>
    </button>
  );
}

/** EngineCard — model selector card (Grok / Aurora / GPT Premium) */
export function EngineCard({ active, icon, label, hint, credits, premium, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-3 transition-all ${
        active
          ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/20 to-[#9333EA]/10"
          : "border-[#2E2E30] bg-[#16161A] hover:border-[#3E3E40]"
      }`}
      data-testid={testId}
    >
      {premium && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 text-black px-2 py-0.5 rounded-md shadow-md">
          Premium
        </span>
      )}
      {active && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      <div className="text-[#A78BFA] mb-1.5">{icon}</div>
      <div className="text-white text-[14px] font-semibold leading-tight mb-0.5">{label}</div>
      {hint && (
        <div className="text-[#8A8A8E] text-[11px] leading-snug line-clamp-2 mb-1.5">{hint}</div>
      )}
      <div className="text-[#A78BFA] text-[11px] font-mono uppercase tracking-wider">
        {credits} cred.
      </div>
    </button>
  );
}

/** EngineGrid — 2-col grid for engines (Grok | Aurora) + 1 wide (GPT Premium) */
export function EngineGrid({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/** Section — collapsible compact section block */
export function Section({ title, hint, children, testId }) {
  return (
    <section
      className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] p-3 space-y-2.5"
      data-testid={testId}
    >
      {(title || hint) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <h2 className="text-white text-[13px] font-semibold font-['Inter_Tight']">
              {title}
            </h2>
          )}
          {hint && (
            <span className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider">
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
