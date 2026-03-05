"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tips = [
  {
    title: "Tipo de shot",
    examples: "Close-up, Wide shot, Medium shot, POV shot",
  },
  {
    title: "Movimento de câmera",
    examples: "slow dolly in, tracking shot, crane up, handheld",
  },
  {
    title: "Iluminação",
    examples: "dramatic spotlight, golden hour, neon-lit, natural soft light",
  },
  {
    title: "Áudio",
    examples: "sons ambiente, música, diálogos",
  },
  {
    title: "First + Last Frame",
    examples: "Descreva a transição entre os dois frames no prompt",
  },
  {
    title: "Negative prompt",
    examples: 'no text, no watermark, no blur, no artifacts',
  },
];

export function PromptTips() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-4 w-4" />
          Dicas de prompt
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm p-4">
        <div className="space-y-2">
          <p className="font-semibold text-sm mb-2">
            Boas práticas para Veo 3.1
          </p>
          {tips.map((tip) => (
            <div key={tip.title}>
              <span className="font-medium text-xs">{tip.title}: </span>
              <span className="text-xs text-muted-foreground">
                {tip.examples}
              </span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
