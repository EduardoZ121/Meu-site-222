import { useEffect } from "react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import { readWhatsAppPrefs, openWhatsAppGenerationNotice } from "../../lib/whatsappNotify";

/** Toast opcional com atalho WhatsApp quando uma geração termina. */
export default function WhatsAppGenerationListener() {
  const { t, lang } = useI18n();

  useEffect(() => {
    const onCreation = (event) => {
      const { enabled } = readWhatsAppPrefs();
      if (!enabled) return;
      const creation = event?.detail;
      if (!creation) return;

      toast.message(t("wa_toast_title"), {
        description: t("notif_generation_body"),
        duration: 12000,
        action: {
          label: t("wa_toast_action"),
          onClick: () => openWhatsAppGenerationNotice(creation, { lang }),
        },
        cancel: {
          label: t("wa_toast_skip"),
          onClick: () => {},
        },
      });
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    return () => window.removeEventListener("rp:creation-succeeded", onCreation);
  }, [t, lang]);

  return null;
}
