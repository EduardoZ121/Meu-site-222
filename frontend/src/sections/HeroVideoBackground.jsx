import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/hero-bg.mp4?v=2";
const POSTER = "/images/hero-bg.jpg?v=14";

export default function HeroVideoBackground() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    const video = videoRef.current;
    if (!node || !video) return;

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
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        poster={POSTER}
        className="w-full h-full object-cover object-[center_42%] opacity-[0.50]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
    </div>
  );
}
