"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { PromptTips } from "./PromptTips";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Film,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
// cn import removed - not needed

// --- Constants ---
const MODELS = [
  { value: "veo-3.1-generate-preview", label: "Veo 3.1" },
  { value: "veo-3.0-generate-001", label: "Veo 3.0" },
];
const ASPECT_RATIOS = ["16:9", "9:16"];
const DURATIONS = ["4", "6", "8"];
const RESOLUTIONS = ["720p", "1080p"];

// --- Types ---
interface FrameData {
  base64: string;
  mimeType: string;
  preview: string;
}

interface Scene {
  id: string;
  prompt: string;
  negativePrompt: string;
  duration: string;
  firstFrame: FrameData | null;
  useLastFrame: boolean;
  lastFrame: FrameData | null;
}

interface SceneResult {
  sceneId: string;
  status: "pending" | "generating" | "done" | "error";
  videoData: string | null;
  error: string | null;
}

// --- Helpers ---
let idCounter = 0;
function newId() {
  return `scene-${++idCounter}-${Date.now()}`;
}

function createEmptyScene(): Scene {
  return {
    id: newId(),
    prompt: "",
    negativePrompt: "",
    duration: "6",
    firstFrame: null,
    useLastFrame: false,
    lastFrame: null,
  };
}

// --- Scene Card Component ---
function SceneCard({
  scene,
  index,
  total,
  collapsed,
  onToggle,
  onChange,
  onRemove,
  disabled,
}: {
  scene: Scene;
  index: number;
  total: number;
  collapsed: boolean;
  onToggle: () => void;
  onChange: (updated: Scene) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const firstFrameRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "firstFrame" | "lastFrame"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      onChange({ ...scene, [field]: { base64, mimeType: file.type, preview: result } });
    };
    reader.readAsDataURL(file);
  };

  const promptPreview =
    scene.prompt.trim().length > 60
      ? scene.prompt.trim().slice(0, 60) + "..."
      : scene.prompt.trim() || "Sem prompt";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
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
          <span className="font-medium text-sm">Cena {index + 1}</span>
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

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Prompt</Label>
              <PromptTips />
            </div>
            <Textarea
              placeholder="Descreva a cena em detalhes..."
              value={scene.prompt}
              onChange={(e) => onChange({ ...scene, prompt: e.target.value })}
              className="min-h-[100px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label>
              Negative Prompt{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              placeholder="no text, no watermark, no blur..."
              value={scene.negativePrompt}
              onChange={(e) => onChange({ ...scene, negativePrompt: e.target.value })}
              className="min-h-[50px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select
              value={scene.duration}
              onValueChange={(v) => onChange({ ...scene, duration: v })}
              disabled={disabled}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}s</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frames */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Frame */}
            <div className="space-y-2">
              <Label>First Frame (opcional)</Label>
              <input
                ref={firstFrameRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "firstFrame")}
              />
              {scene.firstFrame ? (
                <div className="relative inline-block">
                  <img
                    src={scene.firstFrame.preview}
                    alt="First frame"
                    className="h-24 w-auto rounded-lg border object-cover"
                  />
                  {!disabled && (
                    <button
                      onClick={() => {
                        onChange({ ...scene, firstFrame: null });
                        if (firstFrameRef.current) firstFrameRef.current.value = "";
                      }}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => firstFrameRef.current?.click()}
                  disabled={disabled}
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>

            {/* Last Frame */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={scene.useLastFrame}
                  onCheckedChange={(v) => onChange({ ...scene, useLastFrame: v })}
                  disabled={disabled}
                  id={`last-frame-${scene.id}`}
                />
                <Label htmlFor={`last-frame-${scene.id}`} className="cursor-pointer text-sm">
                  End Frame
                </Label>
              </div>
              {scene.useLastFrame && (
                <>
                  <input
                    ref={lastFrameRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "lastFrame")}
                  />
                  {scene.lastFrame ? (
                    <div className="relative inline-block">
                      <img
                        src={scene.lastFrame.preview}
                        alt="Last frame"
                        className="h-24 w-auto rounded-lg border object-cover"
                      />
                      {!disabled && (
                        <button
                          onClick={() => {
                            onChange({ ...scene, lastFrame: null });
                            if (lastFrameRef.current) lastFrameRef.current.value = "";
                          }}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => lastFrameRef.current?.click()}
                      disabled={disabled}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Upload
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export function VideosTab() {
  // Global settings
  const [model, setModel] = useState("veo-3.1-generate-preview");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");

  // Scenes
  const [scenes, setScenes] = useState<Scene[]>([createEmptyScene()]);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<SceneResult[]>([]);
  const [statusText, setStatusText] = useState("");

  const updateScene = useCallback((id: string, updated: Scene) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const removeScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addScene = () => {
    const newScene = createEmptyScene();
    setScenes((prev) => [...prev, newScene]);
    // New scenes start expanded
    setCollapsedMap((prev) => ({ ...prev, [newScene.id]: false }));
  };

  const hasValidScenes = scenes.some((s) => s.prompt.trim().length > 0);

  // --- Sequential generation ---
  const handleGenerate = async () => {
    const validScenes = scenes.filter((s) => s.prompt.trim().length > 0);
    if (validScenes.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma cena com prompt.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setResults([]);

    // Initialize results as pending
    const initialResults: SceneResult[] = validScenes.map((s) => ({
      sceneId: s.id,
      status: "pending",
      videoData: null,
      error: null,
    }));
    setResults(initialResults);

    for (let i = 0; i < validScenes.length; i++) {
      const scene = validScenes[i];
      setStatusText(`Gerando cena ${i + 1} de ${validScenes.length}... aguarde ~60s`);

      // Mark as generating
      setResults((prev) =>
        prev.map((r) => (r.sceneId === scene.id ? { ...r, status: "generating" } : r))
      );

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = {
          prompt: scene.prompt,
          model,
          aspectRatio,
          durationSeconds: scene.duration,
          resolution,
        };

        if (scene.negativePrompt.trim()) {
          body.negativePrompt = scene.negativePrompt;
        }
        if (scene.firstFrame) {
          body.firstFrameBase64 = scene.firstFrame.base64;
          body.firstFrameMimeType = scene.firstFrame.mimeType;
        }
        if (scene.useLastFrame && scene.lastFrame) {
          body.lastFrameBase64 = scene.lastFrame.base64;
          body.lastFrameMimeType = scene.lastFrame.mimeType;
        }

        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao gerar vídeo");
        }

        setResults((prev) =>
          prev.map((r) =>
            r.sceneId === scene.id
              ? { ...r, status: "done", videoData: data.videoData }
              : r
          )
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setResults((prev) =>
          prev.map((r) =>
            r.sceneId === scene.id
              ? { ...r, status: "error", error: error.message || "Falha" }
              : r
          )
        );
      }

      // Wait 60s between scenes (unless last one)
      if (i < validScenes.length - 1) {
        setStatusText(`Cena ${i + 1} concluída. Aguardando 60s antes da próxima...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }

    setGenerating(false);
    setStatusText("");

    const doneCount = validScenes.length;
    toast({
      title: "Geração concluída",
      description: `${doneCount} cena(s) processada(s).`,
    });
  };

  const handleDownload = (videoData: string, sceneIndex: number) => {
    const link = document.createElement("a");
    link.href = `data:video/mp4;base64,${videoData}`;
    link.download = `studio-gen-cena-${sceneIndex + 1}-${Date.now()}.mp4`;
    link.click();
  };

  // Map scene id → index for display
  const sceneIndexMap: Record<string, number> = {};
  scenes.forEach((s, i) => {
    sceneIndexMap[s.id] = i;
  });

  return (
    <div className="space-y-6">
      {/* Global settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select value={model} onValueChange={setModel} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ar) => (
                <SelectItem key={ar} value={ar}>
                  {ar}
                </SelectItem>
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
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scenes list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Cenas ({scenes.length})</Label>
        </div>

        {scenes.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={i}
            total={scenes.length}
            collapsed={!!collapsedMap[scene.id]}
            onToggle={() => toggleCollapse(scene.id)}
            onChange={(updated) => updateScene(scene.id, updated)}
            onRemove={() => removeScene(scene.id)}
            disabled={generating}
          />
        ))}

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={addScene}
          disabled={generating}
        >
          <Plus className="h-4 w-4" />
          Adicionar Cena
        </Button>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !hasValidScenes}
        className="w-full h-12 text-base gap-2"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando Vídeos...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Gerar {scenes.filter((s) => s.prompt.trim()).length > 1
              ? `${scenes.filter((s) => s.prompt.trim()).length} Vídeos`
              : "Vídeo"}
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
            const sceneIdx = sceneIndexMap[result.sceneId];
            return (
              <div
                key={result.sceneId}
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
                    Cena {sceneIdx !== undefined ? sceneIdx + 1 : i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {result.status === "pending" && "— Aguardando"}
                    {result.status === "generating" && "— Gerando..."}
                    {result.status === "done" && "— Concluído"}
                    {result.status === "error" && `— Erro: ${result.error}`}
                  </span>
                </div>

                {result.status === "done" && result.videoData && (
                  <>
                    <video
                      controls
                      className="w-full h-auto rounded-lg max-h-[300px]"
                      src={`data:video/mp4;base64,${result.videoData}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(result.videoData!, sceneIdx ?? i)}
                    >
                      <Download className="h-4 w-4" />
                      Download MP4
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when no results */}
      {results.length === 0 && !generating && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 min-h-[200px] flex items-center justify-center bg-muted/20">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Film className="h-12 w-12 opacity-40" />
            <p className="text-sm">Os vídeos gerados aparecerão aqui</p>
          </div>
        </div>
      )}
    </div>
  );
}
