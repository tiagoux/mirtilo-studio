"use client";

import { useState, useEffect } from "react";
import { StillsTab } from "@/components/StillsTab";
import { VideosTab } from "@/components/VideosTab";
import { LoginScreen } from "@/components/LoginScreen";
import { ImageIcon, Film, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"stills" | "videos">("stills");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUserEmail(data.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setUserEmail("");
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        onSuccess={(email) => {
          setAuthenticated(true);
          setUserEmail(email);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center relative">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {userEmail}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            Studio Gen
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Geração de imagens e vídeos com IA
          </p>
        </div>

        {/* Tab navigation */}
        <div className="grid w-full grid-cols-2 mb-6 rounded-md bg-muted p-1">
          <button
            onClick={() => setActiveTab("stills")}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
              activeTab === "stills"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Stills
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
              activeTab === "videos"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Film className="h-4 w-4" />
            Vídeos
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {activeTab === "stills" && <StillsTab />}
          {activeTab === "videos" && <VideosTab />}
        </div>
      </div>
    </main>
  );
}
