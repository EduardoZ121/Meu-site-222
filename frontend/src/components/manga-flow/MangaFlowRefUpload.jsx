import { useCallback, useRef } from "react";
import ImageUploadZone from "../ImageUploadZone";
import { uploadImageToCloud } from "../../lib/blobUploadClient";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
import { getMangaRefDisplayUrl, isStableRefUrl } from "../../lib/mangaFlowRefStorage";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";

/**
 * Referência visual nos cards do Manga Flow — mesma caixa com brilho das outras sessões.
 */
export default function MangaFlowRefUpload({
  data,
  onUpdate,
  testId = "manga-flow-ref-upload",
  layout = "square",
  emptyLabel,
}) {
  const { t } = useI18n();
  const fileValue = data?.refImage instanceof File ? data.refImage : null;
  const displayUrl = getMangaRefDisplayUrl(data);
  const uploadGenRef = useRef(0);

  const handleChange = useCallback(
    async (file) => {
      if (!file) {
        if (data?.refImageUrl) revokeFilePreviewUrl(data.refImageUrl);
        onUpdate({
          refImage: null,
          refImageUrl: null,
          refPersistUrl: null,
          refUploading: false,
        });
        return;
      }

      const gen = ++uploadGenRef.current;
      if (data?.refImageUrl && String(data.refImageUrl).startsWith("blob:")) {
        revokeFilePreviewUrl(data.refImageUrl);
      }

      const localUrl = URL.createObjectURL(file);
      onUpdate({
        refImage: file,
        refImageUrl: localUrl,
        refPersistUrl: data?.refPersistUrl && isStableRefUrl(data.refPersistUrl) ? data.refPersistUrl : null,
        refUploading: true,
      });

      try {
        const persistUrl = await uploadImageToCloud(file);
        if (gen !== uploadGenRef.current) {
          revokeFilePreviewUrl(localUrl);
          return;
        }
        revokeFilePreviewUrl(localUrl);
        onUpdate({
          refImage: file,
          refImageUrl: persistUrl,
          refPersistUrl: persistUrl,
          refUploading: false,
        });
        toast.success(t("upload_ready"));
      } catch (err) {
        if (gen !== uploadGenRef.current) return;
        onUpdate({
          refImage: file,
          refImageUrl: localUrl,
          refPersistUrl: null,
          refUploading: false,
        });
        toast.warning(err?.message || t("upload_save_error"));
      }
    },
    [data?.refImageUrl, data?.refPersistUrl, onUpdate, t],
  );

  return (
    <div className="mfi-field manga-flow-ref-upload-wrap">
      <label className="mfi-label">{t("manga_upload_png")}</label>
      <ImageUploadZone
        value={fileValue}
        onChange={handleChange}
        layout={layout}
        testId={testId}
        emptyLabel={emptyLabel || t("manga_upload_png")}
        emptyHint={t("upload_empty_hint")}
        enableRemotePersist={false}
        notifyOnPreparedOnly
        compressOptions={{ maxSize: 1280, maxBytes: 2 * 1024 * 1024 }}
        className="manga-flow-ref-upload"
      />
      {displayUrl && !fileValue && (
        <div className="manga-flow-ref-upload-saved">
          <img
            src={displayUrl}
            alt=""
            className="manga-flow-ref-upload-saved__img"
            crossOrigin="anonymous"
            onError={() => {
              if (isStableRefUrl(data?.refPersistUrl)) return;
              onUpdate({ refImageUrl: null, refPersistUrl: null });
              toast.warning(t("upload_save_error"));
            }}
          />
          <p className="mfi-hint">{t("upload_ready")}</p>
        </div>
      )}
      {data?.refUploading && (
        <p className="mfi-hint mt-1 manga-flow-ref-upload--busy">{t("upload_preparing")}</p>
      )}
    </div>
  );
}
