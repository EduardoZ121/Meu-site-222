import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, Upload, Sparkles, X, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { compressImage } from "../lib/imageCompress";
import { fileToDataURL } from "../lib/fileToDataURL";
import { toast } from "sonner";
import ResultPanel from "./ResultPanel";

/**
 * Unified studio frame — Pollo-style.
 *
 * Props:
 *  - title: string ("AI Clothes Changer")
 *  - subtitle: string (optional one-line description)
 *  - models?: { id, label, image }[] — visual model picker (optional)
 *  - selectedModel, onModelChange
 *  - showPhoto: boolean (default true)
 *  - photo, onPhotoChange
 *  - extraFields?: ReactNode — inserted between Model and Prompt (e.g. background remover has no prompt)
 *  - promptLabel?: string ("Background", "Prompt", null=hide)
 *  - prompt, onPromptChange, promptMax
 *  - ideas?: string[] — clickable suggestions under the textarea
 *  - onShuffleIdeas?: () => void
 *  - aspectRatios?: string[] — defaults to ["1:1", "3:4", "4:5", "9:16", "16:9", "21:9"]
 *  - aspect, onAspectChange
 *  - cost: number (credits)
 *  - onCreate: async () => void
 *  - busy, result, onResultChange
 */
export default function ToolFrame({
  title,
  subtitle,
  models,
  selectedModel,
  onModelChange,
  showPhoto = true,
  photo,
  onPhotoChange,
  acceptedFormats = "JPEG, PNG or WEBP up to 15 MB",
  extraFields,
  promptLabel = "Prompt",
  prompt,
  onPromptChange,
  promptMax = 600,
  ideas,
  onShuffleIdeas,
  aspectRatios = ["1:1", "3:4", "4:5", "9:16", "16:9", "21:9"],
  aspect,
  onAspectChange,
  cost,
  onCreate,
  busy,
  result,
  onResultChange,
  testId = "tool",
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewAllModels, setViewAllModels] = useState(false);
  const fileRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!photo) { setPhotoPreview(null); return; }
    fileToDataURL(photo).then((url) => { if (!cancelled) setPhotoPreview(url); }).catch(() => {});
    return () => { cancelled = true; };
  }, [photo]);

  const handlePickFile = async (file) => {
    if (!file) return;
    // Accept by MIME OR extension — Android camera can return application/octet-stream.
    const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name || "");
    if (!isImg) { toast.error("Ficheiro tem de ser uma imagem (JPEG/PNG/WEBP)."); return; }
    try {
      const compressed = await compressImage(file);
      onPhotoChange(compressed);
    } catch (e) {
      toast.error(e.message || "Não consegui ler esta imagem.");
    }
  };

  const visibleModels = models ? (viewAllModels ? models : models.slice(0, 8)) : [];

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid={`${testId}-frame`}>
      {/* Header */}
      <button
        onClick={() => navigate("/app/tools")}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium transition-colors"
        data-testid={`${testId}-back`}
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <div className="mb-10">
        <h1 className="text-[#F4F1EA] text-[32px] md:text-[40px] font-light tracking-[-0.02em] leading-[1.1] mb-3 font-['Inter_Tight']">
          {title}
        </h1>
        {subtitle && <p className="text-[#8A8A8E] text-[15px] max-w-[620px]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        {/* LEFT: inputs */}
        <div className="space-y-8">
          {/* Photo upload */}
          {showPhoto && (
            <section>
              <label className="block text-[#F4F1EA] text-[14px] font-medium mb-3 font-['Inter_Tight']">
                Upload Image <span className="text-[#7C3AED]">*</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handlePickFile(e.dataTransfer.files?.[0]); }}
                className="relative aspect-[16/9] sm:aspect-[2/1] border-2 border-dashed border-[#2E2E30] hover:border-[#7C3AED]/50 bg-[#13131A]/50 rounded-md cursor-pointer transition-all flex items-center justify-center group overflow-hidden"
                data-testid={`${testId}-upload-area`}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onPhotoChange(null); }}
                      className="absolute top-3 right-3 w-9 h-9 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                      data-testid={`${testId}-clear`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-[#7C3AED]/10 flex items-center justify-center group-hover:bg-[#7C3AED]/20 transition-colors">
                      <Upload className="w-5 h-5 text-[#7C3AED]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#F4F1EA] text-[15px] font-medium">Click to upload an image</p>
                    <p className="text-[#5A5A5E] text-[12px]">{acceptedFormats}</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePickFile(e.target.files?.[0])} data-testid={`${testId}-upload-input`} />
            </section>
          )}

          {/* Models grid */}
          {models && models.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">Model</label>
                {models.length > 8 && (
                  <button
                    onClick={() => setViewAllModels(!viewAllModels)}
                    className="text-[#8A8A8E] hover:text-[#7C3AED] text-[12px] font-medium transition-colors"
                    data-testid={`${testId}-view-all`}
                  >
                    {viewAllModels ? "Ver menos" : `Ver todos (${models.length})`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2" data-testid={`${testId}-models`}>
                {visibleModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`relative aspect-[3/4] rounded-md overflow-hidden border-2 transition-all ${
                      selectedModel === m.id
                        ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/40"
                        : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                    }`}
                    data-testid={`${testId}-model-${m.id}`}
                  >
                    {m.image ? (
                      <img src={m.image} alt={m.label} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A1C] to-[#2E2E30] flex items-center justify-center p-2 text-center">
                        <span className="text-[#F4F1EA] text-[11px] font-medium leading-tight">{m.label}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Extra custom fields (e.g., poster fields, scale slider) */}
          {extraFields}

          {/* Prompt */}
          {promptLabel && (
            <section>
              <label className="block text-[#F4F1EA] text-[14px] font-medium mb-3 font-['Inter_Tight']">{promptLabel}</label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  rows={5}
                  maxLength={promptMax}
                  placeholder={ideas?.[0] ? `For example: ${ideas[0]}` : "Describe what you want..."}
                  className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-3.5 rounded-md focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
                  data-testid={`${testId}-prompt`}
                />
                <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[11px] font-mono">{prompt.length} / {promptMax}</span>
              </div>
              {ideas && ideas.length > 0 && (
                <div className="flex items-start gap-2 mt-3 flex-wrap">
                  <span className="text-[#5A5A5E] text-[12px] font-medium shrink-0 mt-1">Ideas:</span>
                  {ideas.map((idea) => (
                    <button
                      key={idea}
                      onClick={() => onPromptChange(idea)}
                      className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[12px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
                      data-testid={`${testId}-idea-${idea.slice(0, 12)}`}
                    >
                      {idea}
                    </button>
                  ))}
                  {onShuffleIdeas && (
                    <button onClick={onShuffleIdeas} className="text-[#5A5A5E] hover:text-[#7C3AED] mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Aspect ratio */}
          {aspectRatios && aspectRatios.length > 0 && onAspectChange && (
            <section>
              <label className="block text-[#F4F1EA] text-[14px] font-medium mb-3 font-['Inter_Tight']">Aspect Ratio</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" data-testid={`${testId}-aspect-ratios`}>
                {aspectRatios.map((a) => (
                  <button
                    key={a}
                    onClick={() => onAspectChange(a)}
                    className={`py-3 border-2 rounded-md text-[12px] font-medium transition-all flex flex-col items-center gap-1 ${
                      aspect === a
                        ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#C4B5FD]"
                        : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#7C3AED]/40 hover:text-[#F4F1EA]"
                    }`}
                    data-testid={`${testId}-aspect-${a}`}
                  >
                    <AspectIcon ratio={a} />
                    <span className="font-mono">{a}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: result panel */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Output</p>
          <ResultPanel creation={result} loading={busy} onChange={onResultChange} emptyLabel="O teu resultado aparece aqui." />
        </aside>
      </div>

      {/* Sticky bottom CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4"
        data-testid={`${testId}-cta-bar`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">Credits required:</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">{cost} <span className="text-[10px] font-mono uppercase tracking-wider">Credits</span></span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={onCreate}
            disabled={busy}
            className="flex-1 sm:flex-initial sm:min-w-[220px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-md text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20"
            data-testid={`${testId}-create-btn`}
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A gerar...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Create · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AspectIcon({ ratio }) {
  const map = {
    "1:1": { w: 14, h: 14 },
    "3:4": { w: 12, h: 16 },
    "4:5": { w: 13, h: 16 },
    "9:16": { w: 10, h: 18 },
    "16:9": { w: 18, h: 10 },
    "21:9": { w: 20, h: 9 },
    "3:2": { w: 18, h: 12 },
    "2:3": { w: 12, h: 18 },
  };
  const { w, h } = map[ratio] || { w: 14, h: 14 };
  return (
    <div className="border-[1.5px] border-current" style={{ width: w + "px", height: h + "px" }} />
  );
}
