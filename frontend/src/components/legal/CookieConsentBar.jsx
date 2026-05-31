import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import { acceptLegalConsent, hasLegalConsent } from "../../lib/legalConsent";

export default function CookieConsentBar() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    setVisible(!hasLegalConsent());
  }, []);

  useEffect(() => {
    const suppress = () => setSuppressed(true);
    const unsuppress = () => setSuppressed(false);
    window.addEventListener("rp:suppress-cookie", suppress);
    window.addEventListener("rp:unsuppress-cookie", unsuppress);
    return () => {
      window.removeEventListener("rp:suppress-cookie", suppress);
      window.removeEventListener("rp:unsuppress-cookie", unsuppress);
    };
  }, []);

  const onAccept = () => {
    acceptLegalConsent();
    setVisible(false);
  };

  const show = visible && !suppressed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed bottom-0 inset-x-0 z-[45] p-2 sm:p-4 pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          data-testid="cookie-consent-bar"
        >
          <div className="pointer-events-auto mx-auto max-w-[920px] rounded-xl sm:rounded-2xl border border-[#9333EA]/30 bg-[#0f0f14]/95 backdrop-blur-xl shadow-[0_-8px_40px_-12px_rgba(124,58,237,0.35)] px-3 py-2.5 sm:px-6 sm:py-5">
            <div className="flex sm:hidden items-center gap-2.5">
              <p id="cookie-consent-desc" className="flex-1 min-w-0 text-[11px] text-[#8A8A8E] leading-snug line-clamp-2">
                {t("consent_body_short")}{" "}
                <Link to="/legal/terms" className="text-[#C4B5FD] underline underline-offset-2">
                  {t("consent_terms")}
                </Link>
              </p>
              <button
                type="button"
                onClick={onAccept}
                className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#9333EA]"
                data-testid="cookie-consent-accept"
              >
                {t("consent_accept")}
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <p
                  id="cookie-consent-title"
                  className="text-sm font-semibold text-[#F4F1EA] font-['Inter_Tight'] mb-1"
                >
                  {t("consent_title")}
                </p>
                <p className="text-[13px] text-[#8A8A8E] leading-relaxed">
                  {t("consent_body")}{" "}
                  <Link to="/legal/terms" className="text-[#C4B5FD] underline underline-offset-2 hover:text-white">
                    {t("consent_terms")}
                  </Link>
                  {" · "}
                  <Link to="/legal/privacy" className="text-[#C4B5FD] underline underline-offset-2 hover:text-white">
                    {t("consent_privacy")}
                  </Link>
                  {" · "}
                  <Link to="/legal/cookies" className="text-[#C4B5FD] underline underline-offset-2 hover:text-white">
                    {t("consent_cookies")}
                  </Link>
                </p>
              </div>
              <button
                type="button"
                onClick={onAccept}
                className="shrink-0 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:opacity-95 transition-opacity"
                data-testid="cookie-consent-accept-desktop"
              >
                {t("consent_accept")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
