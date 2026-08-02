import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ImageIcon, Video } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const shownIds = new Set();

function formatBody(t, creation) {
  const spent = Number(creation?.credits_spent || 0);
  const balance = creation?.new_balance;
  if (spent > 0 && balance != null) {
    return t("notif_generation_body_spent", { n: spent, balance });
  }
  return t("notif_generation_body");
}

function maybeBrowserNotify(title, body) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "rp-generation-ready",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

/**
 * WhatsApp-style drop toast when a generation finishes.
 * Listens to rp:creation-succeeded (once per creation — not every poll tick).
 */
export default function GenerationReadyToastListener() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const onCreation = (event) => {
      const creation = event?.detail;
      if (!creation) return;

      const id = String(creation.id || creation.prediction_id || "");
      if (id) {
        if (shownIds.has(id)) return;
        shownIds.add(id);
        if (shownIds.size > 80) {
          const first = shownIds.values().next().value;
          shownIds.delete(first);
        }
      }

      const isVideo = (creation.type || "") === "video";
      const title = isVideo ? tRef.current("notif_video_ready_title") : tRef.current("notif_generation_title");
      const body = formatBody(tRef.current, creation);
      const toastId = id ? `rp-ready-${id}` : `rp-ready-${Date.now()}`;

      maybeBrowserNotify(title, body);

      toast.custom(
        (tid) => (
          <button
            type="button"
            className="rp-ready-toast"
            data-testid="generation-ready-toast"
            onClick={() => {
              toast.dismiss(tid);
              navigate("/app/gallery");
            }}
          >
            <span className="rp-ready-toast__icon" aria-hidden>
              {isVideo ? <Video className="w-5 h-5" strokeWidth={1.75} /> : <ImageIcon className="w-5 h-5" strokeWidth={1.75} />}
            </span>
            <span className="rp-ready-toast__text">
              <span className="rp-ready-toast__title">{title}</span>
              <span className="rp-ready-toast__body">{body}</span>
              <span className="rp-ready-toast__hint">{tRef.current("notif_open_gallery")}</span>
            </span>
          </button>
        ),
        {
          id: toastId,
          duration: 7000,
          position: "top-center",
        },
      );
    };

    window.addEventListener("rp:creation-succeeded", onCreation);
    return () => window.removeEventListener("rp:creation-succeeded", onCreation);
  }, [navigate]);

  return null;
}
