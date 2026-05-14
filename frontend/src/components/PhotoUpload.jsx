import { useId, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { fileToDataURL } from "../lib/fileToDataURL";

/** Drag/drop file input; emits File object + preview URL.
 *
 * Mobile-safe pattern:
 *  - Uses native <label htmlFor={inputId}> wrapping the trigger area so a single
 *    tap on Android Chrome / iOS Safari always opens the file picker. The
 *    previous `ref.current.click()` workaround required 2-3 taps because some
 *    Android Chrome builds drop the programmatic click when the receiving
 *    button's pointerdown handler is competing with the page's touch listeners.
 *  - The hidden <input> stays mounted; React resets it via key when value=null
 *    so reselecting the same image still fires onChange.
 */
export default function PhotoUpload({ value, onChange, accept = "image/*", testId = "photo-upload" }) {
  const inputId = useId();
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!value) { setPreview(null); return; }
    fileToDataURL(value).then((url) => { if (!cancelled) setPreview(url); }).catch(() => {});
    return () => { cancelled = true; };
  }, [value]);

  const pick = (file) => {
    if (file && file.type.startsWith("image/")) onChange(file);
  };
  const clear = () => { onChange(null); setNonce((n) => n + 1); };

  return (
    <div className="w-full" data-testid={testId}>
      {!value ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={`w-full aspect-[4/5] border border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
            drag ? "border-rp-purple bg-rp-purple/5" : "border-rp-border hover:border-rp-mute"
          }`}
          data-testid={`${testId}-trigger`}
        >
          <Upload className="w-5 h-5 text-rp-mute pointer-events-none" strokeWidth={1.5} />
          <p className="text-rp-text text-sm font-mono uppercase tracking-[0.12em] pointer-events-none">Drop a photo</p>
          <p className="text-rp-mute2 text-[11px] font-mono pointer-events-none">or click to browse</p>
        </label>
      ) : (
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-rp-surface group">
          {preview && (
            <img src={preview} alt="reference" className="w-full h-full object-cover" data-testid={`${testId}-preview`} />
          )}
          <button onClick={clear} className="absolute top-3 right-3 w-8 h-8 bg-rp-bg/80 backdrop-blur-sm flex items-center justify-center text-rp-text hover:bg-rp-bg" data-testid={`${testId}-clear`}>
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 bg-rp-bg/80 backdrop-blur-sm text-rp-mute text-[10px] font-mono uppercase">
            <ImageIcon className="w-3 h-3" /> {(value.size / 1024).toFixed(0)} KB
          </div>
        </div>
      )}
      <input
        key={nonce}
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
        data-testid={`${testId}-input`}
      />
    </div>
  );
}
