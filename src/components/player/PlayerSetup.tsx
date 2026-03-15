"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="w-full">
      {/* Header with emoji */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vali nimi ja avatar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium">
            Nimi
          </Label>
          <Input
            id="name"
            placeholder="Sinu nimi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoComplete="off"
            autoFocus
            className="text-lg h-13 rounded-xl bg-card"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium">Avatar</Label>
          <EmojiPicker selected={emoji} onSelect={setEmoji} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="handicap" className="text-base font-medium">
            Handicap{" "}
            <span className="text-muted-foreground font-normal text-sm">
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
            className="h-13 rounded-xl bg-card"
          />
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-14 text-lg font-semibold rounded-2xl"
          size="lg"
        >
          {submitLabel} ⛳
        </Button>
      </form>
    </div>
  );
}
