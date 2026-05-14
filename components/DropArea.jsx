import { useId, useState } from "react";

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
  accept = "image/*",
  disabled = false,
}) {
  const inputId = useId();
  const [drag, setDrag] = useState(false);

  const handle = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    onPick(file);
  };

  return (
    <>
      <label
        htmlFor={disabled ? undefined : inputId}
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDrag(true); } }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { if (disabled) return; e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
        className={`${className} ${drag ? "ring-2 ring-[#7C3AED]/50" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
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
