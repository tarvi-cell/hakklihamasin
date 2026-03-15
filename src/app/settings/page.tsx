"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerSetup } from "@/components/player/PlayerSetup";
import { usePlayer } from "@/hooks/usePlayer";
import type { LocalPlayer } from "@/hooks/usePlayer";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { player, savePlayer } = usePlayer();

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">Seaded</h1>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Theme */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <div>
                  <Label className="text-base">Tume teema</Label>
                  <p className="text-sm text-muted-foreground">
                    Parem silmadele pimedas
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Player profile */}
        <div>
          <h2 className="font-semibold mb-3">Profiil</h2>
          <PlayerSetup
            initialPlayer={player}
            onComplete={(p: LocalPlayer) => savePlayer(p)}
            title="Muuda profiili"
            submitLabel="Salvesta"
          />
        </div>

        {/* Version */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Hakklihamasin v0.1.0</p>
          <p>Made with ⛳ and ☕</p>
        </div>
      </div>
    </div>
  );
}
