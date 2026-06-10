const CATEGORY_PALETTES = {
  men: ["#0B0B0C", "#334155", "#7C3AED"],
  women: ["#1F102A", "#EC4899", "#FBCFE8"],
  unisex: ["#101827", "#06B6D4", "#C4B5FD"],
  flyer: ["#1A1A1C", "#EF4444", "#FACC15"],
  flyers: ["#1A1A1C", "#EF4444", "#FACC15"],
  music: ["#120820", "#7C3AED", "#EC4899"],
  food: ["#1F1308", "#B45309", "#FACC15"],
  fitness: ["#020617", "#16A34A", "#BEF264"],
  motivational: ["#111827", "#F59E0B", "#F4F1EA"],
  couple: ["#1C1427", "#C084FC", "#F9A8D4"],
  comic: ["#0F172A", "#F97316", "#FDE047"],
  stories: ["#111827", "#38BDF8", "#A78BFA"],
  sensual: ["#190A12", "#BE123C", "#F9A8D4"],
  anime: ["#101827", "#60A5FA", "#F9A8D4"],
  cartoon: ["#172554", "#FACC15", "#FB7185"],
  paint: ["#1C1917", "#C7A77A", "#F4F1EA"],
  fantasy: ["#0F172A", "#7C3AED", "#22D3EE"],
  vintage: ["#292524", "#C7A77A", "#F59E0B"],
  realism: ["#0B0B0C", "#475569", "#F4F1EA"],
  mood: ["#180A2A", "#7C3AED", "#EC4899"],
  enhance: ["#0B1324", "#06B6D4", "#C4B5FD"],
};

const KEYWORD_PALETTES = [
  { rx: /underwater|submers|water|ocean|sea|blue/i, colors: ["#021923", "#0EA5E9", "#67E8F9"], symbol: "≈" },
  { rx: /luxury|gold|dourad|premium|glamour/i, colors: ["#120C04", "#C7A77A", "#FDE68A"], symbol: "◆" },
  { rx: /neon|cyber|futur|tech|hacker/i, colors: ["#050816", "#7C3AED", "#22D3EE"], symbol: "⌁" },
  { rx: /fitness|gym|power|champion/i, colors: ["#020617", "#16A34A", "#BEF264"], symbol: "▲" },
  { rx: /romantic|soft|pastel|dream/i, colors: ["#201024", "#F9A8D4", "#C4B5FD"], symbol: "✦" },
  { rx: /dark|noir|shadow|black/i, colors: ["#030303", "#27272A", "#7C3AED"], symbol: "◒" },
  { rx: /anime|manga|ghibli|cartoon|disney/i, colors: ["#13203A", "#60A5FA", "#F9A8D4"], symbol: "✧" },
  { rx: /poster|flyer|typography|headline|brand/i, colors: ["#111111", "#EF4444", "#FACC15"], symbol: "▣" },
  { rx: /food|restaurant|burger|chef|dish/i, colors: ["#1F1308", "#F97316", "#FDE68A"], symbol: "●" },
  { rx: /music|dj|album|concert|stream/i, colors: ["#16051F", "#7C3AED", "#EC4899"], symbol: "♪" },
];

function hash(input = "") {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickVisual(prompt = "", category = "", id = "") {
  const key = `${id} ${category} ${prompt}`;
  const h = hash(key);
  const match = KEYWORD_PALETTES.find((p) => p.rx.test(key));
  const colors = match?.colors || CATEGORY_PALETTES[category] || CATEGORY_PALETTES.unisex;
  return {
    colors,
    symbol: match?.symbol || ["✦", "◆", "◈", "▣", "◇", "◒"][h % 6],
    angle: 110 + (h % 70),
    orbX: 15 + (h % 70),
    orbY: 10 + ((h >> 3) % 70),
    stripe: 18 + (h % 18),
    shape: h % 4,
  };
}

export default function StyleCover({
  id,
  title,
  prompt = "",
  category = "unisex",
  eyebrow,
  premium = false,
  selected = false,
  className = "",
  compact = false,
  /** URL pública (ex.: /images/padrao-covers/men_underwater.jpg) — substitui o gradiente. */
  coverSrc = "",
  coverObjectPosition = "center center",
}) {
  const visual = pickVisual(prompt, category, id || title);
  const [a, b, c] = visual.colors;
  const words = (title || id || "Style").replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || visual.symbol;
  const hasPhoto = Boolean(coverSrc);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#0B0B0C] ${className}`}
      style={
        hasPhoto
          ? undefined
          : {
            background:
              `linear-gradient(${visual.angle}deg, ${a} 0%, ${b} 54%, ${c} 120%)`,
          }
      }
    >
      {hasPhoto && (
        <img
          src={coverSrc}
          alt=""
          decoding="async"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: coverObjectPosition }}
        />
      )}

      {!hasPhoto && (
        <>
          <div
            className="absolute -inset-10 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at ${visual.orbX}% ${visual.orbY}%, rgba(255,255,255,0.34), transparent 28%), radial-gradient(circle at ${100 - visual.orbX}% ${100 - visual.orbY}%, rgba(0,0,0,0.45), transparent 34%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.16] mix-blend-screen"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.55) 1px, transparent 1px)",
              backgroundSize: `${visual.stripe}px ${visual.stripe}px`,
            }}
          />
        </>
      )}
      <div
        className={
          hasPhoto
            ? "absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/95 via-[#0B0B0C]/35 to-[#0B0B0C]/10"
            : "absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/92 via-[#0B0B0C]/30 to-transparent"
        }
      />

      {!hasPhoto && (
        <>
          {visual.shape === 0 && <div className="absolute left-[12%] top-[18%] h-20 w-20 rounded-full border border-white/30" />}
          {visual.shape === 1 && <div className="absolute right-[12%] top-[16%] h-24 w-16 rotate-12 border border-white/25" />}
          {visual.shape === 2 && <div className="absolute left-[18%] top-[20%] h-16 w-28 -rotate-12 rounded-full border border-white/25" />}
          {visual.shape === 3 && <div className="absolute right-[18%] top-[18%] h-20 w-20 rotate-45 border border-white/25" />}
        </>
      )}

      <div
        className={`absolute right-3 top-3 font-['JetBrains_Mono'] text-[28px] ${hasPhoto ? "text-white/40 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]" : "text-white/30 drop-shadow-[0_0_18px_rgba(255,255,255,0.25)]"}`}
      >
        {visual.symbol}
      </div>

      <div className={`absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border font-['JetBrains_Mono'] text-[11px] font-semibold tracking-[0.08em] backdrop-blur-sm ${hasPhoto ? "border-white/20 bg-black/45 text-white/90" : "border-white/25 bg-black/20 text-white/80"}`}>
        {initials}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        {eyebrow && (
          <p className="mb-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.18em] text-white/55">
            {eyebrow}
          </p>
        )}
        <p className={`${compact ? "text-[12px]" : "text-[13px]"} line-clamp-2 font-['Inter_Tight'] font-medium leading-tight text-[#F4F1EA] drop-shadow-md`}>
          {title || id}
        </p>
        {premium && <p className="mt-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.16em] text-[#FDE68A]">Premium</p>}
      </div>

      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#7C3AED] text-[11px] font-bold text-white shadow-lg shadow-[#7C3AED]/50">
          ✓
        </div>
      )}
    </div>
  );
}
