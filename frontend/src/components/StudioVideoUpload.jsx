import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Film, Upload, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import {
  looksLikeVideoFile,
  MAX_VIDEO_BYTES,
  VIDEO_ACCEPT,
} from "../lib/imageCompress";

const MAX_DIRECT_BYTES = 12 * 1024 * 1024;

function formatBytes(n) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

/**
 * Upload de vídeo dedicado (video-to-video) — sem ImageUploadZone.
 * Fluxo simples: escolher ficheiro → pré-visualizar → envio no Gerar (Blob no uploadPost).
 */
export default function StudioVideoUpload({
  value,
  onChange,
  testId = "studio-video-upload",
  disabled = false,
}) {
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      setMeta({ duration: 0, width: 0, height: 0 });
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const ingest = useCallback((file) => {
    if (!file || !looksLikeVideoFile(file)) {
      toast.error(t("vid_edit_video_hint"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t("vid_edit_video_hint"));
      return;
    }
    onChange(file);
  }, [onChange, t]);

  const clear = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const onLoadedMetadata = (e) => {
    const v = e.currentTarget;
    setMeta({
      duration: v.duration || 0,
      width: v.videoWidth || 0,
      height: v.videoHeight || 0,
    });
  };

  const needsCloud = value && value.size > MAX_DIRECT_BYTES;

  return (
    <div className="studio-video-upload" data-testid={testId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={VIDEO_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ingest(f);
        }}
        data-testid={`${testId}-input`}
      />

      {!value ? (
        <label
          htmlFor={inputId}
          onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) ingest(f);
          }}
          className={[
            "studio-video-upload__drop",
            drag ? "studio-video-upload__drop--drag" : "",
            disabled ? "opacity-50 pointer-events-none" : "",
          ].join(" ")}
          data-testid={`${testId}-drop`}
        >
          <div className="studio-video-upload__icon-wrap">
            <Film className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="studio-video-upload__title">{t("vid_upload_title")}</p>
          <p className="studio-video-upload__hint">{t("vid_edit_video_hint")}</p>
          <span className="studio-video-upload__btn">
            <Upload className="w-4 h-4" />
            {t("vid_upload_pick")}
          </span>
        </label>
      ) : (
        <div className="studio-video-upload__card" data-testid={`${testId}-card`}>
          <div className="studio-video-upload__preview-wrap">
            {previewUrl ? (
              <video
                src={previewUrl}
                className="studio-video-upload__preview"
                controls
                playsInline
                muted
                onLoadedMetadata={onLoadedMetadata}
                data-testid={`${testId}-preview`}
              />
            ) : null}
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="studio-video-upload__clear"
              aria-label={t("vid_upload_remove")}
              data-testid={`${testId}-clear`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="studio-video-upload__meta">
            <p className="studio-video-upload__filename">{value.name}</p>
            <p className="studio-video-upload__stats">
              {formatBytes(value.size)}
              {meta.duration > 0 ? ` · ${formatDuration(meta.duration)}` : ""}
              {meta.width > 0 ? ` · ${meta.width}×${meta.height}` : ""}
            </p>
            {needsCloud ? (
              <p className="studio-video-upload__cloud-note flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#A78BFA]" />
                <span>{t("vid_edit_large_hint")}</span>
              </p>
            ) : (
              <p className="studio-video-upload__ready">{t("vid_upload_ready")}</p>
            )}
          </div>
          <label htmlFor={inputId} className="studio-video-upload__replace">
            {t("vid_upload_replace")}
          </label>
        </div>
      )}
    </div>
  );
}

export { MAX_DIRECT_BYTES as VIDEO_DIRECT_MAX_BYTES };
