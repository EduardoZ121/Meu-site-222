import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/hero-bg.mp4?v=2";

export default function HeroVideoBackground() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    const video = videoRef.current;
    if (!node || !video) return;

    const markReady = () => setVideoReady(true);
    video.addEventListener("playing", markReady, { once: true });
    video.addEventListener("canplaythrough", markReady, { once: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.12, rootMargin: "80px 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      video.removeEventListener("playing", markReady);
      video.removeEventListener("canplaythrough", markReady);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#0B0B0C]">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className={`w-full h-full object-cover object-[center_42%] transition-opacity duration-700 ease-out ${
          videoReady ? "opacity-[0.50]" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
    </div>
  );
}
