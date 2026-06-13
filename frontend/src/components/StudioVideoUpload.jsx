import { useCallback, useEffect, useRef, useState } from "react";
import ImageUploadZone, { VIDEO_DIRECT_MAX_BYTES } from "./ImageUploadZone";
import { uploadVideoToCloud } from "../lib/blobUploadClient";
import { pickBlobOffloadTimeoutMs, MAX_VIDEO_SOURCE_PICKER_BYTES } from "../lib/uploadConstants";
import { readVideoDurationSeconds } from "../lib/videoMedia";
import { useI18n } from "../lib/i18n";
import { toast } from "sonner";

export { VIDEO_DIRECT_MAX_BYTES };

/**
 * Upload de vídeo → Vercel Blob (multipart, directo no browser).
 * Sem compressor/recortador — ficheiro vai directo para a nuvem.
 */
export default function StudioVideoUpload({
  value,
  onChange,
  onCloudUrlChange,
  onStatusChange,
  onCloudProgressChange,
  testId = "studio-video-upload",
  disabled = false,
  emptyLabel,
  emptyHint,
  className = "",
  maxDurationSec = 10,
  requireCloudUrl = true,
}) {
  const { t } = useI18n();
  const [cloudProgress, setCloudProgress] = useState(null);
  const [cloudUrl, setCloudUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const uploadGenRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const setProgress = useCallback((pct) => {
    setCloudProgress(pct);
    onCloudProgressChange?.(pct);
  }, [onCloudProgressChange]);

  useEffect(() => {
    if (!value) {
      setCloudProgress(null);
      setCloudUrl(null);
      setUploadError(null);
      onCloudUrlChange?.(null);
      onCloudProgressChange?.(null);
    }
  }, [value, onCloudUrlChange, onCloudProgressChange]);

  const startCloudUpload = useCallback((file) => {
    if (!file) return;

    uploadGenRef.current += 1;
    const gen = uploadGenRef.current;
    setCloudUrl(null);
    setUploadError(null);
    onCloudUrlChange?.(null);
    setProgress(0);
    onStatusChange?.("saving");
    toast.message(t("vid_cloud_upload_start"), { duration: 5000 });

    void readVideoDurationSeconds(file, { timeoutMs: 8000 })
      .then((dur) => {
        if (Number.isFinite(dur) && dur > maxDurationSec) {
          toast.message(
            t("vid_edit_duration_cap_hint", { sec: maxDurationSec, actual: Math.round(dur) }),
            { duration: 8000 },
          );
        }
      })
      .catch(() => { /* upload anyway */ });

    void uploadVideoToCloud(file, {
      timeoutMs: pickBlobOffloadTimeoutMs(file.size, true),
      onProgress: (pct) => {
        if (gen !== uploadGenRef.current) return;
        setProgress(pct);
      },
    })
      .then((url) => {
        if (gen !== uploadGenRef.current) return;
        if (valueRef.current !== file) return;
        setCloudUrl(url);
        onCloudUrlChange?.(url);
        onStatusChange?.("saved");
        setProgress(100);
        setUploadError(null);
        toast.success(t("vid_cloud_upload_done"), { duration: 6000 });
      })
      .catch((err) => {
        if (gen !== uploadGenRef.current) return;
        setCloudUrl(null);
        onCloudUrlChange?.(null);
        onStatusChange?.("error");
        setProgress(null);
        const msg = err?.message || t("vid_cloud_upload_fail");
        setUploadError(msg);
        toast.error(msg, { duration: 12000 });
      });
  }, [maxDurationSec, onCloudUrlChange, onCloudProgressChange, onStatusChange, setProgress, t]);

  const retryCloudUpload = useCallback(() => {
    const file = valueRef.current;
    if (!file) return;
    startCloudUpload(file);
  }, [startCloudUpload]);

  const handleZoneStatus = useCallback((status) => {
    if (status === "saved") return;
    onStatusChange?.(status);
  }, [onStatusChange]);

  const handleChange = useCallback((file) => {
    uploadGenRef.current += 1;
    setProgress(null);
    setUploadError(null);
    setCloudUrl(null);
    onCloudUrlChange?.(null);

    if (!file) {
      onChange(null);
      onStatusChange?.("idle");
      return;
    }

    onChange(file);
    startCloudUpload(file);
  }, [onChange, onCloudUrlChange, onStatusChange, setProgress, startCloudUpload]);

  const cloudReady = Boolean(value) && !uploadError && (
    !requireCloudUrl || Boolean(cloudUrl)
  );

  return (
    <div className="relative">
      <ImageUploadZone
        value={value}
        onChange={handleChange}
        onStatusChange={handleZoneStatus}
        mediaType="video"
        layout="video"
        testId={testId}
        className={className}
        disabled={disabled}
        enableRemotePersist={false}
        maxVideoBytes={MAX_VIDEO_SOURCE_PICKER_BYTES}
        emptyLabel={emptyLabel ?? t("vid_upload_title")}
        emptyHint={emptyHint ?? t("vid_edit_video_hint")}
        maxVideoDurationSec={null}
        videoDeferReadyState
        forceUploadReady={cloudReady && Boolean(value)}
        forceUploadBusy={Boolean(value) && !cloudReady && !uploadError}
      />
      {cloudProgress != null && cloudProgress < 100 && value ? (
        <p
          className="mt-2 text-center text-[11px] font-mono text-amber-200/90"
          data-testid={`${testId}-cloud-progress`}
        >
          {t("vid_cloud_upload_progress", { n: cloudProgress })}
        </p>
      ) : null}
      {uploadError && value ? (
        <div
          className="mt-3 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3"
          data-testid={`${testId}-upload-error`}
        >
          <p className="text-[12px] text-red-100 leading-snug">{uploadError}</p>
          <button
            type="button"
            onClick={retryCloudUpload}
            className="mt-2 text-[12px] font-semibold text-[#C4B5FD] hover:text-white underline-offset-2 hover:underline"
            data-testid={`${testId}-upload-retry`}
          >
            {t("vid_cloud_upload_retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
