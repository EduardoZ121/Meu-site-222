import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import { acceptLegalConsent, hasLegalConsent } from "../../lib/legalConsent";

export default function CookieConsentBar() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasLegalConsent());
  }, []);

  const onAccept = () => {
    acceptLegalConsent();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-[200] pointer-events-none sm:max-w-[380px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          data-testid="cookie-consent-bar"
        >
          <div className="pointer-events-auto rounded-2xl border border-[#9333EA]/30 bg-[#0f0f14]/95 backdrop-blur-xl shadow-[0_-8px_40px_-12px_rgba(124,58,237,0.35)] px-4 py-3 sm:px-4 sm:py-3.5">
            <div className="flex flex-col gap-3">
              <div className="flex-1 min-w-0">
                <p
                  id="cookie-consent-title"
                  className="text-[13px] font-semibold text-[#F4F1EA] font-['Inter_Tight'] mb-1"
                >
                  {t("consent_title")}
                </p>
                <p id="cookie-consent-desc" className="text-[11.5px] text-[#8A8A8E] leading-relaxed">
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
                className="shrink-0 w-full px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:opacity-95 transition-opacity"
                data-testid="cookie-consent-accept"
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
