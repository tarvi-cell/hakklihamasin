"use client";

import { useState, useEffect, useCallback } from "react";

export interface LocalPlayer {
  id: string | null;
  name: string;
  emoji: string;
  handicap: number | null;
}

const STORAGE_KEY = "hakklihamasin-player";

const DEFAULT_PLAYER: LocalPlayer = {
  id: null,
  name: "",
  emoji: "🏌️",
  handicap: null,
};

function loadPlayer(): LocalPlayer {
  if (typeof window === "undefined") return DEFAULT_PLAYER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return DEFAULT_PLAYER;
}

export function usePlayer() {
  const [player, setPlayer] = useState<LocalPlayer>(DEFAULT_PLAYER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPlayer(loadPlayer());
    setIsLoaded(true);
  }, []);

  const savePlayer = useCallback((updated: LocalPlayer) => {
    setPlayer(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updatePlayer = useCallback(
    (partial: Partial<LocalPlayer>) => {
      const updated = { ...player, ...partial };
      savePlayer(updated);
    },
    [player, savePlayer]
  );

  const isSetUp = isLoaded && !!player.name && !!player.emoji;

  return { player, isLoaded, isSetUp, savePlayer, updatePlayer };
}
