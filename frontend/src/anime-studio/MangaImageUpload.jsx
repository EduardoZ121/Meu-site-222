import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import ImageUploadZone from "../components/ImageUploadZone";
import { readFileAsDataURL } from "../lib/previewDataUrl";

export default function MangaImageUpload({
  url,
  onUrlChange,
  label,
  hint,
  layout = "square",
  testId = "anime-image-upload",
  compact = false,
}) {
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!url) setFile(null);
  }, [url]);

  const handleFileChange = useCallback(
    async (f) => {
      setFile(f);
      if (!f) {
        onUrlChange?.(null);
        return;
      }
      try {
        onUrlChange?.(await readFileAsDataURL(f));
      } catch {
        onUrlChange?.(null);
      }
    },
    [onUrlChange],
  );

  return (
    <div className={compact ? "as-upload as-upload--compact" : "as-upload"}>
      {label ? <p className="as-field-label">{label}</p> : null}
      {url && !file ? (
        <div className="as-upload-existing">
          <img src={url} alt="" />
          <button type="button" className="as-upload-clear" onClick={() => onUrlChange?.(null)} aria-label="Remover">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
      <ImageUploadZone
        value={file}
        onChange={handleFileChange}
        layout={layout}
        testId={testId}
        enableRemotePersist={false}
        compressOptions={{ maxSize: 1024, maxBytes: 2 * 1024 * 1024 }}
        className={compact ? "[&_label]:min-h-[7rem]" : ""}
      />
      {hint ? <p className="as-field-hint">{hint}</p> : null}
    </div>
  );
}
