import { useCallback, useEffect, useRef, useState } from "react";
import ImageUploadZone, { VIDEO_DIRECT_MAX_BYTES } from "./ImageUploadZone";
import VideoClipStudio from "./video/VideoClipStudio";
import { uploadVideoToCloud } from "../lib/blobUploadClient";
import { pickBlobOffloadTimeoutMs, MAX_VIDEO_SOURCE_PICKER_BYTES } from "../lib/uploadConstants";
import { readVideoDurationSeconds, VIDEO_VERCEL_SAFE_BYTES } from "../lib/videoMedia";
import { useI18n } from "../lib/i18n";
import { toast } from "sonner";

export { VIDEO_DIRECT_MAX_BYTES };

/**
 * Vídeo-to-vídeo — ficheiros grandes vão automaticamente para Vercel Blob (sem cortar manualmente).
 */
export default function StudioVideoUpload({
  value,
  onChange,
  onCloudUrlChange,
  onStatusChange,
  testId = "studio-video-upload",
  disabled = false,
  emptyLabel,
  emptyHint,
  className = "",
  maxDurationSec = 10,
  /** Grok e outros motores que exigem URL pública — sempre envia para a nuvem. */
  requireCloudUrl = false,
}) {
  const { t } = useI18n();
  const [cloudProgress, setCloudProgress] = useState(null);
  const [clipSourceFile, setClipSourceFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const uploadGenRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!value) {
      setCloudProgress(null);
      setUploadError(null);
      onCloudUrlChange?.(null);
    }
  }, [value, onCloudUrlChange]);

  const startCloudUpload = useCallback((file) => {
    if (!file) return;
    uploadGenRef.current += 1;
    const gen = uploadGenRef.current;
    setCloudProgress(null);
    setUploadError(null);
    onCloudUrlChange?.(null);

    const mustUploadToCloud = requireCloudUrl || file.size > VIDEO_VERCEL_SAFE_BYTES;
    if (!mustUploadToCloud) {
      onStatusChange?.("saved");
      return;
    }

    onStatusChange?.("saving");
    setCloudProgress(0);
    toast.message(t("vid_cloud_upload_start"), { duration: 5000 });

    void uploadVideoToCloud(file, {
      timeoutMs: pickBlobOffloadTimeoutMs(file.size, true),
      onProgress: (pct) => {
        if (gen !== uploadGenRef.current) return;
        setCloudProgress(pct);
      },
    })
      .then((url) => {
        if (gen !== uploadGenRef.current) return;
        if (valueRef.current !== file) return;
        onCloudUrlChange?.(url);
        onStatusChange?.("saved");
        setCloudProgress(100);
        setUploadError(null);
        toast.success(t("vid_cloud_upload_done"), { duration: 6000 });
      })
      .catch((err) => {
        if (gen !== uploadGenRef.current) return;
        onCloudUrlChange?.(null);
        onStatusChange?.("error");
        setCloudProgress(null);
        const msg = err?.message || t("vid_cloud_upload_fail");
        setUploadError(msg);
        toast.error(msg, { duration: 12000 });
      });
  }, [onCloudUrlChange, onStatusChange, requireCloudUrl, t]);

  const retryCloudUpload = useCallback(() => {
    const file = valueRef.current;
    if (!file) return;
    startCloudUpload(file);
  }, [startCloudUpload]);

  const handleZoneStatus = useCallback((status) => {
    // ImageUploadZone marca "saved" cedo — o estado real vem do upload à nuvem.
    if (status === "saved") return;
    onStatusChange?.(status);
  }, [onStatusChange]);

  const handleChange = useCallback((file) => {
    uploadGenRef.current += 1;
    setCloudProgress(null);
    setUploadError(null);
    onCloudUrlChange?.(null);
    setClipSourceFile(null);

    if (!file) {
      onChange(null);
      onStatusChange?.("idle");
      return;
    }

    onChange(file);
    onStatusChange?.("saving");

    void readVideoDurationSeconds(file, { timeoutMs: 15000 })
      .then((dur) => {
        if (Number.isFinite(dur) && dur > maxDurationSec) {
          setClipSourceFile(file);
          onChange(null);
          onStatusChange?.("idle");
          return;
        }
        startCloudUpload(file);
      })
      .catch(() => {
        startCloudUpload(file);
      });
  }, [maxDurationSec, onChange, onCloudUrlChange, onStatusChange, startCloudUpload]);

  const handleClipComplete = useCallback((trimmed) => {
    setClipSourceFile(null);
    onChange(trimmed);
    startCloudUpload(trimmed);
  }, [onChange, startCloudUpload]);

  const handleClipClose = useCallback(() => {
    uploadGenRef.current += 1;
    setClipSourceFile(null);
    onChange(null);
    onCloudUrlChange?.(null);
    onStatusChange?.("idle");
    setCloudProgress(null);
    setUploadError(null);
  }, [onChange, onCloudUrlChange, onStatusChange]);

  const cloudReady = Boolean(value) && !uploadError && (
    !requireCloudUrl || cloudProgress === 100
  );

  return (
    <div className="relative">
      {clipSourceFile ? (
        <VideoClipStudio
          file={clipSourceFile}
          maxClipSec={maxDurationSec}
          onClose={handleClipClose}
          onComplete={handleClipComplete}
          testId={`${testId}-clip-studio`}
        />
      ) : null}
      <ImageUploadZone
        value={value}
        onChange={handleChange}
        onStatusChange={handleZoneStatus}
        mediaType="video"
        layout="video"
        testId={testId}
        className={className}
        disabled={disabled || Boolean(clipSourceFile)}
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
