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
  const uploadGenRef = useRef(0);

  useEffect(() => {
    if (!value) {
      setCloudProgress(null);
      onCloudUrlChange?.(null);
    }
  }, [value, onCloudUrlChange]);

  const startCloudUpload = useCallback((file) => {
    uploadGenRef.current += 1;
    const gen = uploadGenRef.current;
    setCloudProgress(null);
    onCloudUrlChange?.(null);
    onChange(file);

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
        onCloudUrlChange?.(url);
        onStatusChange?.("saved");
        setCloudProgress(100);
        toast.success(t("vid_cloud_upload_done"), { duration: 6000 });
      })
      .catch((err) => {
        if (gen !== uploadGenRef.current) return;
        onChange(null);
        onCloudUrlChange?.(null);
        onStatusChange?.("error");
        setCloudProgress(null);
        toast.error(err?.message || t("vid_cloud_upload_fail"), { duration: 12000 });
      });
  }, [onChange, onCloudUrlChange, onStatusChange, requireCloudUrl, t]);

  const handleZoneStatus = useCallback((status) => {
    // ImageUploadZone marca "saved" antes do upload à nuvem terminar.
    if (status === "saved") return;
    onStatusChange?.(status);
  }, [onStatusChange]);

  const handleChange = useCallback((file) => {
    uploadGenRef.current += 1;
    setCloudProgress(null);
    onCloudUrlChange?.(null);
    setClipSourceFile(null);

    if (!file) {
      onChange(null);
      onStatusChange?.("idle");
      return;
    }

    // Preview imediato na caixa — antes era só após validar duração/upload.
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
    startCloudUpload(trimmed);
  }, [startCloudUpload]);

  const handleClipClose = useCallback(() => {
    uploadGenRef.current += 1;
    setClipSourceFile(null);
    onChange(null);
    onCloudUrlChange?.(null);
    onStatusChange?.("idle");
    setCloudProgress(null);
  }, [onChange, onCloudUrlChange, onStatusChange]);

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
      />
      {cloudProgress != null && cloudProgress < 100 && value ? (
        <p
          className="mt-2 text-center text-[11px] font-mono text-amber-200/90"
          data-testid={`${testId}-cloud-progress`}
        >
          {t("vid_cloud_upload_progress", { n: cloudProgress })}
        </p>
      ) : null}
    </div>
  );
}
