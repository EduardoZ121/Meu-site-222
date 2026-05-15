import { Download, Heart, Share2, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

/**
 * Renders the last generated creation with download/favorite/public-toggle actions.
 * Type can be: image | artistic | poster | video | carousel
 */
export default function ResultPanel({ creation, loading, onChange, emptyLabel = "Your first frame will appear here." }) {
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="card-rp p-10 aspect-square flex flex-col items-center justify-center" data-testid="result-loading">
        <Loader2 className="w-6 h-6 text-rp-lavender animate-spin mb-4" />
        <p className="text-rp-mute text-sm">Crafting your frame…</p>
        <p className="text-rp-mute2 text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">This may take 30-90s</p>
      </div>
    );
  }
  if (!creation) {
    return (
      <div className="card-rp p-10 text-center aspect-square flex flex-col items-center justify-center" data-testid="result-empty">
        <Sparkles className="w-6 h-6 text-rp-mute2 mb-4" strokeWidth={1.5} />
        <p className="text-rp-mute text-sm">{emptyLabel}</p>
      </div>
    );
  }

  const isVideo = creation.type === "video";
  const main = creation.result_urls?.[0];

  const toggleFavorite = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/generations/${creation.id}/favorite`);
      onChange?.({ ...creation, is_favorite: data.is_favorite });
      toast.success(data.is_favorite ? "Saved" : "Unsaved");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const togglePublic = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/me/toggle-public/${creation.id}`);
      onChange?.({ ...creation, is_public: data.is_public });
      toast.success(data.is_public ? "Published to Explore" : "Made private");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="card-rp p-3" data-testid="result-panel">
      <div className="aspect-square bg-rp-bg overflow-hidden mb-3">
        {isVideo ? (
          <video src={main} controls className="w-full h-full object-cover" data-testid="result-video" />
        ) : (
          <img src={main} alt="" className="w-full h-full object-cover" data-testid="result-image" />
        )}
      </div>
      {creation.result_urls.length > 1 && (
        <div className="grid grid-cols-4 gap-1 mb-3">
          {creation.result_urls.slice(1).map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden block">
              <img src={u} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="text-rp-mute text-[12px] mb-3 line-clamp-2">{creation.prompt}</p>
      <div className="flex gap-2">
        <a href={main} target="_blank" rel="noreferrer" className="btn-secondary flex-1 !py-2.5" data-testid="result-download">
          <Download className="w-3.5 h-3.5" /> Open
        </a>
        <button onClick={toggleFavorite} disabled={busy} className={`btn-secondary !py-2.5 !px-4 ${creation.is_favorite ? "!border-rp-purple !text-rp-lavender" : ""}`} data-testid="result-favorite">
          <Heart className="w-3.5 h-3.5" fill={creation.is_favorite ? "currentColor" : "none"} />
        </button>
        <button onClick={togglePublic} disabled={busy} className={`btn-secondary !py-2.5 !px-4 ${creation.is_public ? "!border-rp-purple !text-rp-lavender" : ""}`} data-testid="result-public">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
