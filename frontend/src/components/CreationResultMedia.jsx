import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useI18n } from "../lib/i18n";
import {
  displayMediaUrl,
  isVideoCreation,
  primaryResultUrl,
  proxiedMediaUrl,
} from "../lib/creationUrls";

/**
 * Preview de resultado (estúdio / ferramentas) com proxy Replicate e estado de erro visível.
 */
export default function CreationResultMedia({
  creation,
  className = "max-h-[520px] w-full object-contain",
  containerClassName = "min-h-[280px] bg-rp-bg overflow-hidden flex items-center justify-center",
  testId = "result-image",
}) {
  const { t } = useI18n();
  const rawUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, rawUrl);
  const [src, setSrc] = useState(() => displayMediaUrl(rawUrl, false));
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    setSrc(displayMediaUrl(rawUrl, false));
  }, [rawUrl, creation?.id]);

  const onError = () => {
    const proxy = proxiedMediaUrl(rawUrl);
    if (proxy && src !== proxy) {
      setSrc(proxy);
      return;
    }
    setBroken(true);
  };

  if (!rawUrl) {
    return (
      <div className={containerClassName} data-testid="result-media-empty">
        <p className="text-rp-mute text-sm px-4 text-center">{t("res_preview_failed")}</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div
        className={`${containerClassName} flex-col gap-2 text-rp-mute2`}
        data-testid="result-media-broken"
      >
        <ImageOff className="w-8 h-8 opacity-50" strokeWidth={1.25} />
        <p className="text-[11px] text-center px-4">{t("res_preview_failed")}</p>
        <a
          href={rawUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-rp-lavender underline"
        >
          {t("open")}
        </a>
      </div>
    );
  }

  return isVideo ? (
    <video
      src={src}
      controls
      className={className}
      onError={onError}
      data-testid={testId === "result-image" ? "result-video" : testId}
      referrerPolicy="no-referrer"
    />
  ) : (
    <img
      src={src}
      alt=""
      className={className}
      onError={onError}
      loading="lazy"
      referrerPolicy="no-referrer"
      data-testid={testId}
    />
  );
}
