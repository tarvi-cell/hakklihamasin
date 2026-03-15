"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmojiPicker } from "./EmojiPicker";
import type { LocalPlayer } from "@/hooks/usePlayer";

interface PlayerSetupProps {
  initialPlayer?: LocalPlayer;
  onComplete: (player: LocalPlayer) => void;
  title?: string;
  submitLabel?: string;
}

export function PlayerSetup({
  initialPlayer,
  onComplete,
  title = "Tere tulemast!",
  submitLabel = "Alustame!",
}: PlayerSetupProps) {
  const [name, setName] = useState(initialPlayer?.name || "");
  const [emoji, setEmoji] = useState(initialPlayer?.emoji || "🏌️");
  const [handicap, setHandicap] = useState<string>(
    initialPlayer?.handicap != null ? String(initialPlayer.handicap) : ""
  );

  const canSubmit = name.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onComplete({
      id: initialPlayer?.id || null,
      name: name.trim(),
      emoji,
      handicap: handicap ? Number(handicap) : null,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="text-5xl mb-3">{emoji}</div>
        <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">
          {title}
        </CardTitle>
        <p className="text-muted-foreground text-sm mt-1">
          Vali nimi ja avatar
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nimi</Label>
            <Input
              id="name"
              placeholder="Sinu nimi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="off"
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <EmojiPicker selected={emoji} onSelect={setEmoji} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handicap">
              Handicap{" "}
              <span className="text-muted-foreground font-normal">
                (valikuline)
              </span>
            </Label>
            <Input
              id="handicap"
              type="number"
              placeholder="nt 18"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              min={0}
              max={54}
              step={0.1}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {submitLabel} ⛳
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
