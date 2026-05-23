import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Film, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";

const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";
const MAX_BYTES = 80 * 1024 * 1024;

function looksLikeVideo(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  const n = (file.name || "").toLowerCase();
  return n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm");
}

export default function VideoUploadZone({
  value,
  onChange,
  testId = "video-upload-zone",
  className = "",
  emptyLabel,
  emptyHint,
  onStatusChange,
}) {
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const resolvedLabel = emptyLabel ?? t("vid_edit_video_label");
  const resolvedHint = emptyHint ?? t("vid_edit_video_hint");

  const notify = useCallback((s) => onStatusChange?.(s), [onStatusChange]);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      notify("idle");
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    notify("ready");
    return () => URL.revokeObjectURL(url);
  }, [value, notify]);

  const pickFile = useCallback((file) => {
    if (!file) return;
    if (!looksLikeVideo(file)) {
      toast.error(t("vid_edit_video_hint"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("vid_edit_video_hint"));
      return;
    }
    onChange?.(file);
  }, [onChange, t]);

  const onInput = (e) => {
    const f = e.target.files?.[0];
    pickFile(f || null);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files?.[0] || null);
  };

  return (
    <div className={className} data-testid={testId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={VIDEO_ACCEPT}
        className="sr-only"
        onChange={onInput}
        data-testid={`${testId}-input`}
      />
      {!value ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center gap-3 min-h-[200px] rounded-2xl border border-dashed cursor-pointer transition-all duration-300 ${
            drag
              ? "border-violet-400/60 bg-violet-500/10 shadow-[0_0_40px_-12px_rgba(168,85,247,0.45)]"
              : "border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-500/[0.06]"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/25 flex items-center justify-center">
            <Upload className="w-5 h-5 text-violet-300" strokeWidth={1.75} />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-white">{resolvedLabel}</p>
            <p className="text-xs text-zinc-500 mt-1.5 max-w-xs">{resolvedHint}</p>
          </div>
        </label>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60">
          <video
            src={previewUrl}
            className="w-full max-h-[320px] object-contain bg-black"
            controls
            playsInline
            muted
            data-testid={`${testId}-preview`}
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono uppercase tracking-wider text-violet-200">
            <Film className="w-3 h-3" />
            {(value.size / (1024 * 1024)).toFixed(1)} MB
          </div>
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 border border-white/15 flex items-center justify-center text-white hover:bg-red-500/30 hover:border-red-400/40 transition-colors"
            aria-label={t("remove")}
            data-testid={`${testId}-clear`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
