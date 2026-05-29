import { useCallback } from "react";
import ImageUploadZone from "../ImageUploadZone";
import { uploadImageToCloud } from "../../lib/blobUploadClient";
import { revokeFilePreviewUrl } from "../../lib/previewDataUrl";
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

      if (data?.refImageUrl) revokeFilePreviewUrl(data.refImageUrl);
      const localUrl = URL.createObjectURL(file);
      onUpdate({
        refImage: file,
        refImageUrl: localUrl,
        refPersistUrl: null,
        refUploading: true,
      });

      try {
        const persistUrl = await uploadImageToCloud(file);
        onUpdate({
          refImage: file,
          refImageUrl: localUrl,
          refPersistUrl: persistUrl,
          refUploading: false,
        });
        toast.success(t("upload_ready"));
      } catch (err) {
        onUpdate({
          refImage: file,
          refImageUrl: localUrl,
          refPersistUrl: null,
          refUploading: false,
        });
        toast.warning(err?.message || t("upload_save_error"));
      }
    },
    [data?.refImageUrl, onUpdate, t],
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
        compressOptions={{ maxSize: 1280, maxBytes: 2 * 1024 * 1024 }}
        className="manga-flow-ref-upload"
      />
      {data?.refImageUrl && !fileValue && (
        <p className="mfi-hint mt-2">{t("upload_preview_unavailable")}</p>
      )}
    </div>
  );
}
