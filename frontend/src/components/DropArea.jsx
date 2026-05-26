import { useId, useState } from "react";
import { toast } from "sonner";
import { IMAGE_ACCEPT, looksLikeImageFile } from "../lib/imageCompress";

/** Mobile-safe drop area for image uploads.
 *  Uses native <label htmlFor> so a single tap on Android/iOS opens the picker.
 *  Re-mounts the <input> via `key` after each clear so re-selecting the same file fires onChange.
 *
 *  Props:
 *   - onPick:     (File) => void
 *   - className:  applied to the visible label element
 *   - children:   what to render inside the label (your custom CTA / preview)
 *   - testId:     for the input element
 *   - resetKey:   external reset signal (e.g. boolean toggled when value becomes null)
 *   - accept:     defaults to "image/*"
 */
export default function DropArea({
  onPick,
  className = "",
  children,
  testId = "drop-area",
  resetKey = 0,
  accept = IMAGE_ACCEPT,
  disabled = false,
}) {
  const inputId = useId();
  const [drag, setDrag] = useState(false);

  const handle = (file) => {
    if (!file) return;
    if (!looksLikeImageFile(file)) {
      toast.error("Ficheiro não reconhecido como imagem. Usa JPEG, PNG ou WEBP.");
      return;
    }
    onPick(file);
  };

  return (
    <>
      <label
        htmlFor={disabled ? undefined : inputId}
        tabIndex={disabled ? -1 : 0}
        onPaste={(e) => {
          if (disabled) return;
          const f = e.clipboardData?.files?.[0];
          if (f && looksLikeImageFile(f)) {
            e.preventDefault();
            handle(f);
          }
        }}
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDrag(true); } }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { if (disabled) return; e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
        className={`${className} ${drag ? "ring-2 ring-[#9333EA]/50 border-[#9333EA]/30" : ""} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#9333EA]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] rounded-xl"} min-h-[44px]`}
        data-testid={`${testId}-label`}
      >
        {children}
      </label>
      <input
        key={resetKey}
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handle(e.target.files?.[0])}
        data-testid={testId}
      />
    </>
  );
}
