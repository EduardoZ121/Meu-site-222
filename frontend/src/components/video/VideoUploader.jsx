import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Film, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import {
  MAX_VIDEO_UPLOAD_BYTES,
  validateVideoUpload,
  VIDEO_UPLOAD_ACCEPT,
} from "../../lib/videoMedia";
import VideoPreview from "./VideoPreview";

const MAX_DIRECT_BYTES = 12 * 1024 * 1024;

function formatBytes(n) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Zona de upload de vídeo com validação separada de imagem (50 MB, MP4/MOV).
 */
export default function VideoUploader({
  value,
  onChange,
  testId = "studio-video-upload",
  disabled = false,
  previewExtra = null,
  footer = null,
}) {
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = "";
  }, [value]);

  const ingest = useCallback((file) => {
    const check = validateVideoUpload(file, t);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    onChange(file);
  }, [onChange, t]);

  const clear = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const needsCloud = value && value.size > MAX_DIRECT_BYTES;

  if (!value) {
    return (
      <div className="studio-video-upload" data-testid={testId}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={VIDEO_UPLOAD_ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) ingest(f);
          }}
          data-testid={`${testId}-input`}
        />
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
      </div>
    );
  }

  return (
    <div className="studio-video-upload" data-testid={testId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={VIDEO_UPLOAD_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ingest(f);
        }}
        data-testid={`${testId}-input`}
      />
      <div className="studio-video-upload__card" data-testid={`${testId}-card`}>
        <div className="studio-video-upload__preview-wrap">
          <VideoPreview
            file={value}
            testId={`${testId}-preview`}
            onMeta={setMeta}
          />
          {previewExtra}
        </div>
        {footer ?? (
          <div className="studio-video-upload__meta">
            <p className="studio-video-upload__filename">{value.name}</p>
            <p className="studio-video-upload__stats">
              {formatBytes(value.size)}
              {meta.duration > 0 ? ` · ${Math.round(meta.duration)}s` : ""}
              {meta.width > 0 ? ` · ${meta.width}×${meta.height}` : ""}
            </p>
          </div>
        )}
        <label htmlFor={inputId} className="studio-video-upload__replace">
          {t("vid_upload_replace")}
        </label>
      </div>
    </div>
  );
}

export { MAX_DIRECT_BYTES as VIDEO_DIRECT_MAX_BYTES, MAX_VIDEO_UPLOAD_BYTES };
