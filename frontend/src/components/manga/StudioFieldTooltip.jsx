import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function StudioFieldTooltip({ title, why, tip }) {
  if (!title && !why && !tip) return null;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-[#5A5A5E] hover:text-[#A855F7] transition-colors ml-1"
            aria-label="Ajuda"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[260px] text-[11px] leading-relaxed bg-[#1a1a24] border-[#9333EA]/40 text-[#E9D5FF] p-3"
        >
          {title && <p className="font-semibold text-white mb-1">{title}</p>}
          {why && <p className="text-[#C4B5FD] mb-1"><span className="text-[#A855F7]">Porquê: </span>{why}</p>}
          {tip && <p className="text-[#9CA3AF]"><span className="text-[#8B5CF6]">Dica: </span>{tip}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
