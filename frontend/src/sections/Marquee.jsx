import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────
   Remake · Triple-track scramble marquee
   ──────────────────────────────────────────────────────────────────────
   Why this is different than a plain CSS scroll:

   1. THREE rows scrolling at different speeds in opposite directions —
      creates a true parallax that feels alive instead of one boring line.
   2. Selected "anchor" words (PIXEL, REMAKE, AI, etc.) periodically
      re-scramble their letters then settle, mirroring the product name.
      This is the visual metaphor of the brand: a remake, pixel by pixel.
   3. Each token is independently styled — accent tokens glow on hover,
      regular text stays subdued. Reading feels like a film credit roll.

   The effect uses only CSS keyframes for scroll (perf-cheap) plus a
   single rAF-driven scramble cycle for the anchor words. No motion
   library required.
   ──────────────────────────────────────────────────────────────────── */

// Three independent token tracks (top: left, middle: right, bottom: left)
const TRACK_A = [
  { t: "REMAKE", anchor: true },
  { t: "pixel a pixel.", italic: true },
  { t: "·" },
  { t: "Cada momento", italic: true },
  { t: "·" },
  { t: "uma estética", italic: true },
  { t: "·" },
  { t: "REIMAGINADA", anchor: true },
  { t: "·" },
  { t: "93 ESTILOS" },
  { t: "·" },
  { t: "44 TEMPLATES" },
  { t: "·" },
  { t: "6S VIDEOS" },
  { t: "·" },
  { t: "MOTOR RÁPIDO" },
  { t: "·" },
  { t: "MOTOR PRO" },
  { t: "·" },
  { t: "MOTOR PREMIUM" },
  { t: "·" },
];

const TRACK_B = [
  { t: "Sem subscrição.", italic: true },
  { t: "·" },
  { t: "Sem marca de água.", italic: true },
  { t: "·" },
  { t: "Sem letra pequena.", italic: true },
  { t: "·" },
  { t: "PAGA SÓ O QUE USAS", anchor: true },
  { t: "·" },
  { t: "PACOTES DE CRÉDITOS", muted: true },
  { t: "·" },
  { t: "PORTUGUÊS" },
  { t: "·" },
  { t: "ENGLISH" },
  { t: "·" },
  { t: "ESPAÑOL" },
  { t: "·" },
  { t: "FRANÇAIS" },
  { t: "·" },
];

const TRACK_C = [
  { t: "ONDE A", muted: true },
  { t: "IA", anchor: true },
  { t: "ENCONTRA A", muted: true },
  { t: "ARTE EDITORIAL", italic: true },
  { t: "·" },
  { t: "Refaz a tua imagem.", italic: true },
  { t: "·" },
  { t: "Reescreve a tua estética.", italic: true },
  { t: "·" },
  { t: "CINEMÁTICO", anchor: true },
  { t: "·" },
  { t: "PREMIUM" },
  { t: "·" },
  { t: "PRONTO PARA INSTAGRAM" },
  { t: "·" },
  { t: "DIRETO POR API" },
  { t: "·" },
];

/* — Scramble logic (FX-style text shuffle) — */
const SCRAMBLE_CHARS = "▓▒░█▌▐■□◆◇▲▼◀▶◯※⚡✦✧※█▌▐";
function scrambleStep(original, progress) {
  if (progress >= 1) return original;
  const reveal = Math.floor(original.length * progress);
  let out = "";
  for (let i = 0; i < original.length; i++) {
    if (i < reveal || original[i] === " ") out += original[i];
    else out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
  }
  return out;
}

function AnchorWord({ word }) {
  const [display, setDisplay] = useState(word);
  const animatingRef = useRef(false);

  useEffect(() => {
    let timeoutId, rafId;
    const cycle = () => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      const start = performance.now();
      const duration = 1000 + Math.random() * 800;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setDisplay(scrambleStep(word, p));
        if (p < 1) rafId = requestAnimationFrame(tick);
        else {
          animatingRef.current = false;
          setDisplay(word);
        }
      };
      rafId = requestAnimationFrame(tick);
    };
    // Each instance triggers on its own random interval so the screen
    // never has all anchors scrambling at the same time.
    const stagger = 4000 + Math.random() * 8000;
    const interval = setInterval(cycle, stagger);
    timeoutId = setTimeout(cycle, 800 + Math.random() * 2000);
    return () => { clearInterval(interval); clearTimeout(timeoutId); cancelAnimationFrame(rafId); };
  }, [word]);

  return <span className="font-mono tabular-nums">{display}</span>;
}

function Token({ tok }) {
  const base = "mx-3 inline-block transition-all duration-300";
  if (tok.t === "·") {
    return <span className={`${base} text-[#7C3AED]/45 select-none`} aria-hidden>◆</span>;
  }
  if (tok.anchor) {
    return (
      <span className={`${base} text-[#F4F1EA] font-mono tracking-[0.16em] uppercase hover:text-[#C4B5FD] hover:scale-[1.08] hover:drop-shadow-[0_0_12px_rgba(196,181,253,0.7)]`}>
        <AnchorWord word={tok.t} />
      </span>
    );
  }
  if (tok.italic) {
    return <span className={`${base} italic text-[#C4B5FD]/85 font-light tracking-tight normal-case`}>{tok.t}</span>;
  }
  if (tok.muted) {
    return <span className={`${base} text-[#F4F1EA]/40 font-mono tracking-[0.16em] uppercase`}>{tok.t}</span>;
  }
  return <span className={`${base} text-[#F4F1EA]/75 font-mono tracking-[0.16em] uppercase hover:text-[#F4F1EA] hover:tracking-[0.22em]`}>{tok.t}</span>;
}

function Track({ tokens, speed, reverse, className }) {
  // The track is rendered twice so the keyframes can loop seamlessly at -50%.
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={`flex whitespace-nowrap ${reverse ? "rp-marquee-rev" : "rp-marquee"}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((cycle) => (
          <div key={cycle} className="flex shrink-0">
            {tokens.map((tok, i) => (
              <Token key={`${cycle}-${i}`} tok={tok} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="relative overflow-hidden border-y border-[#7C3AED]/25 bg-[#0B0B0C]" data-testid="marquee-section">
      {/* Ambient glow on top + bottom edges */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/60 to-transparent" />
      {/* Subtle background grain — matches dark editorial aesthetic */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "10px 10px",
      }} />
      {/* Side fade-masks so the marquee feels infinite (no abrupt cut) */}
      <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-[#0B0B0C] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-[#0B0B0C] to-transparent pointer-events-none" />

      <div className="relative py-4 space-y-1.5">
        <Track tokens={TRACK_A} speed={48} reverse={false} className="text-[12px] leading-[1.4]" />
        <Track tokens={TRACK_B} speed={64} reverse={true}  className="text-[11px] leading-[1.4] opacity-90" />
        <Track tokens={TRACK_C} speed={56} reverse={false} className="text-[11px] leading-[1.4] opacity-85" />
      </div>
    </section>
  );
}
