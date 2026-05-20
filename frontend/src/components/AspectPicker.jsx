import { Check } from "lucide-react";

/**
 * Shared aspect-ratio picker.
 *
 * The "match" option (sentinel value) means "keep the original photo dimensions"
 * and is only enabled when `hasPhoto` is true. The backend interprets it as
 * The backend maps `match` to the best supported model value so the upload's
 * proportions are preserved.
 *
 * Props:
 *   value     – string, current aspect ("match" | "1:1" | "4:5" | "3:4" | "9:16" | "16:9" | "21:9")
 *   onChange  – (newValue) => void
 *   hasPhoto  – boolean, whether a reference photo is uploaded
 *   testIdPrefix – string, optional test-id namespace
 *   options   – optional list of explicit ratios to offer (defaults below)
 */
export default function AspectPicker({
  value,
  onChange,
  hasPhoto = false,
  testIdPrefix = "aspect",
  options = ["1:1", "4:5", "3:4", "9:16", "16:9", "21:9"],
}) {
  const items = hasPhoto
    ? [{ key: "match", label: "Original", hint: "Manter a da foto" }, ...options.map((k) => ({ key: k, label: k }))]
    : options.map((k) => ({ key: k, label: k }));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5" data-testid={`${testIdPrefix}-row`}>
      {items.map(({ key, label, hint }) => {
        const active = value === key;
        const isMatch = key === "match";
        return (
          <button
            type="button"
            key={key}
            onClick={() => onChange(key)}
            data-testid={`${testIdPrefix}-${key}`}
            className={`relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-medium font-['Inter_Tight'] transition-all overflow-hidden border ${
              active
                ? "border-[#7C3AED] bg-[rgba(124,58,237,0.1)] text-[#E9E4DC] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]"
                : "border-[rgba(244,241,234,0.08)] text-[#8A8A8E] hover:border-[rgba(124,58,237,0.35)] hover:text-[#F4F1EA]"
            }`}
          >
            {isMatch ? (
              <PhotoIcon active={active} />
            ) : (
              <AspectIcon ratio={key} active={active} />
            )}
            <span className="font-['Inter_Tight']">{label}</span>
            {hint && <span className="text-[9px] text-[#5A5A5E] leading-none">{hint}</span>}
            {active && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center border border-white/15 shadow-sm">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AspectIcon({ ratio, active }) {
  const map = {
    "1:1":  { w: 14, h: 14 },
    "4:5":  { w: 12, h: 15 },
    "3:4":  { w: 12, h: 16 },
    "9:16": { w: 9,  h: 16 },
    "16:9": { w: 18, h: 10 },
    "21:9": { w: 21, h: 9  },
    "5:4":  { w: 16, h: 13 },
    "4:3":  { w: 16, h: 12 },
  };
  const { w, h } = map[ratio] || { w: 14, h: 14 };
  return (
    <span
      className={`block border-[1.5px] rounded-sm ${active ? "border-[#C4B5FD]" : "border-[#5A5A5E]"}`}
      style={{ width: w + "px", height: h + "px" }}
    />
  );
}

function PhotoIcon({ active }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center w-[18px] h-[14px] border-[1.5px] rounded-[3px] ${
        active ? "border-[#C4B5FD]" : "border-[#5A5A5E]"
      }`}
    >
      <span
        className={`absolute right-1 top-1 w-1.5 h-1.5 rounded-full ${
          active ? "bg-[#C4B5FD]" : "bg-[#5A5A5E]"
        }`}
      />
      <span
        className={`absolute bottom-0.5 left-0.5 right-0.5 h-1 ${
          active ? "border-t border-[#C4B5FD]" : "border-t border-[#5A5A5E]"
        }`}
        style={{ clipPath: "polygon(0 100%, 30% 50%, 60% 80%, 100% 30%, 100% 100%)" }}
      />
    </span>
  );
}
