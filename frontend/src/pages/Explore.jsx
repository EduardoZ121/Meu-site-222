import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";
import GalleryMedia from "../components/GalleryMedia";
import { usePageSeo } from "../lib/usePageSeo";
import { SEO_EXPLORE } from "../lib/seoEn";

export default function Explore() {
  usePageSeo({
    title: SEO_EXPLORE.title,
    documentTitle: SEO_EXPLORE.documentTitle,
    description: SEO_EXPLORE.description,
    path: SEO_EXPLORE.path,
  });
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/explore?limit=48").then((r) => setItems(r.data.creations || []));
  }, []);

  return (
    <div className="relative min-h-screen bg-rp-bg" data-testid="explore-page">
      <div className="film-grain" />
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container-rp text-center max-w-[840px]">
          <p className="eyebrow mb-5">Explore</p>
          <h1 className="heading-xl mb-6">A drift of <span className="italic text-rp-lavender">made things</span>.</h1>
          <p className="body-text">Creations marked public by their makers. Click any frame to see the prompt.</p>
        </div>
      </section>

      <section className="pb-32">
        <div className="container-rp">
          {items.length === 0 ? (
            <p className="text-center text-rp-mute py-20">No public creations yet — be the first to share one.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1" data-testid="explore-grid">
              {items.map((c) => (
                <button key={c.id} onClick={() => setActive(c)} className="aspect-square overflow-hidden bg-rp-surface relative group" data-testid={`explore-${c.id}`}>
                  <GalleryMedia publicView creation={c} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-rp-bg/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-rp-text text-[10px] font-mono uppercase tracking-[0.16em]">View prompt →</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-50 bg-rp-bg/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8" onClick={() => setActive(null)} data-testid="explore-modal">
          <div className="relative w-full max-w-6xl h-full max-h-[85vh] bg-rp-surface border border-rp-border flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center">
              <GalleryMedia publicView creation={active} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="w-full md:w-96 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto border-t md:border-t-0 md:border-l border-rp-border">
              <p className="eyebrow">Prompt</p>
              <p className="text-rp-text font-heading text-2xl leading-tight">{active.prompt}</p>
              <div className="space-y-3 text-sm">
                <Row k="Motor" v={active.model_used || "Motor IA"} />
                <Row k="Tipo" v={active.type} />
                <Row k="Formato" v={active.aspect_ratio} />
              </div>
              <button onClick={() => setActive(null)} className="btn-secondary mt-auto" data-testid="explore-close">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-rp-border pb-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2">{k}</span>
      <span className="text-rp-text text-sm font-mono">{v}</span>
    </div>
  );
}
