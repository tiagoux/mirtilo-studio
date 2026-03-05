"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronDown,
  ChevronRight,
  Download,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
// cn import removed - not needed

// --- Constants ---
const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"];
const RESOLUTIONS = ["1K", "2K", "4K"];

// --- Types ---
interface ImageItem {
  id: string;
  prompt: string;
}

interface ImageResult {
  itemId: string;
  status: "pending" | "generating" | "done" | "error";
  imageData: string | null;
  mimeType: string;
  error: string | null;
}

// --- Helpers ---
let idCounter = 0;
function newId() {
  return `img-${++idCounter}-${Date.now()}`;
}

function createEmptyItem(): ImageItem {
  return { id: newId(), prompt: "" };
}

// --- Item Card ---
function ImageItemCard({
  item,
  index,
  total,
  collapsed,
  onToggle,
  onChange,
  onRemove,
  disabled,
}: {
  item: ImageItem;
  index: number;
  total: number;
  collapsed: boolean;
  onToggle: () => void;
  onChange: (updated: ImageItem) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const promptPreview =
    item.prompt.trim().length > 60
      ? item.prompt.trim().slice(0, 60) + "..."
      : item.prompt.trim() || "Sem prompt";

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">Imagem {index + 1}</span>
          {collapsed && (
            <span className="text-xs text-muted-foreground ml-2 truncate max-w-[300px]">
              — {promptPreview}
            </span>
          )}
        </div>
        {total > 1 && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-4">
          <Label>Prompt</Label>
          <Textarea
            placeholder="Descreva a imagem que deseja gerar..."
            value={item.prompt}
            onChange={(e) => onChange({ ...item, prompt: e.target.value })}
            className="min-h-[100px] resize-none"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export function StillsTab() {
  // Global settings
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");

  // Items
  const [items, setItems] = useState<ImageItem[]>([createEmptyItem()]);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [statusText, setStatusText] = useState("");

  const updateItem = useCallback((id: string, updated: ImageItem) => {
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addItem = () => {
    const newItem = createEmptyItem();
    setItems((prev) => [...prev, newItem]);
    setCollapsedMap((prev) => ({ ...prev, [newItem.id]: false }));
  };

  const hasValidItems = items.some((it) => it.prompt.trim().length > 0);

  // --- Sequential generation ---
  const handleGenerate = async () => {
    const validItems = items.filter((it) => it.prompt.trim().length > 0);
    if (validItems.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um prompt.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setResults([]);

    const initialResults: ImageResult[] = validItems.map((it) => ({
      itemId: it.id,
      status: "pending",
      imageData: null,
      mimeType: "image/png",
      error: null,
    }));
    setResults(initialResults);

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      setStatusText(`Gerando imagem ${i + 1} de ${validItems.length}...`);

      setResults((prev) =>
        prev.map((r) => (r.itemId === item.id ? { ...r, status: "generating" } : r))
      );

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: item.prompt, aspectRatio, resolution }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao gerar imagem");
        }

        setResults((prev) =>
          prev.map((r) =>
            r.itemId === item.id
              ? { ...r, status: "done", imageData: data.imageData, mimeType: data.mimeType || "image/png" }
              : r
          )
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setResults((prev) =>
          prev.map((r) =>
            r.itemId === item.id
              ? { ...r, status: "error", error: error.message || "Falha" }
              : r
          )
        );
      }

      // Small delay between requests to avoid rate limits
      if (i < validItems.length - 1) {
        setStatusText(`Imagem ${i + 1} concluída. Gerando próxima...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setGenerating(false);
    setStatusText("");
    toast({
      title: "Geração concluída",
      description: `${validItems.length} imagem(ns) processada(s).`,
    });
  };

  const handleDownload = (imageData: string, mimeType: string, index: number) => {
    const ext = mimeType.split("/")[1] || "png";
    const link = document.createElement("a");
    link.href = `data:${mimeType};base64,${imageData}`;
    link.download = `studio-gen-img-${index + 1}-${Date.now()}.${ext}`;
    link.click();
  };

  const itemIndexMap: Record<string, number> = {};
  items.forEach((it, i) => {
    itemIndexMap[it.id] = i;
  });

  return (
    <div className="space-y-6">
      {/* Global settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ar) => (
                <SelectItem key={ar} value={ar}>{ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Resolução</Label>
          <Select value={resolution} onValueChange={setResolution} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        <Label className="text-base">Imagens ({items.length})</Label>

        {items.map((item, i) => (
          <ImageItemCard
            key={item.id}
            item={item}
            index={i}
            total={items.length}
            collapsed={!!collapsedMap[item.id]}
            onToggle={() => toggleCollapse(item.id)}
            onChange={(updated) => updateItem(item.id, updated)}
            onRemove={() => removeItem(item.id)}
            disabled={generating}
          />
        ))}

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={addItem}
          disabled={generating}
        >
          <Plus className="h-4 w-4" />
          Adicionar Imagem
        </Button>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !hasValidItems}
        className="w-full h-12 text-base gap-2"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando Imagens...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Gerar {items.filter((it) => it.prompt.trim()).length > 1
              ? `${items.filter((it) => it.prompt.trim()).length} Imagens`
              : "Imagem"}
          </>
        )}
      </Button>

      {/* Status */}
      {generating && statusText && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {statusText}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base">Resultados</Label>

          {results.map((result, i) => {
            const idx = itemIndexMap[result.itemId];
            return (
              <div
                key={result.itemId}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  {result.status === "pending" && (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {result.status === "generating" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {result.status === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {result.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium text-sm">
                    Imagem {idx !== undefined ? idx + 1 : i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {result.status === "pending" && "— Aguardando"}
                    {result.status === "generating" && "— Gerando..."}
                    {result.status === "done" && "— Concluído"}
                    {result.status === "error" && `— Erro: ${result.error}`}
                  </span>
                </div>

                {result.status === "done" && result.imageData && (
                  <>
                    <img
                      src={`data:${result.mimeType};base64,${result.imageData}`}
                      alt={`Imagem ${idx !== undefined ? idx + 1 : i + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(result.imageData!, result.mimeType, idx ?? i)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !generating && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 min-h-[200px] flex items-center justify-center bg-muted/20">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageIcon className="h-12 w-12 opacity-40" />
            <p className="text-sm">As imagens geradas aparecerão aqui</p>
          </div>
        </div>
      )}
    </div>
  );
}
