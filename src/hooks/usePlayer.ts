"use client";

import { useState, useEffect, useCallback } from "react";

export interface LocalPlayer {
  id: string;
  name: string;
  emoji: string;
  handicap: number | null;
}

const STORAGE_KEY = "hakklihamasin-player";

const DEFAULT_PLAYER: LocalPlayer = {
  id: "",
  name: "",
  emoji: "🏌️",
  handicap: null,
};

function loadPlayer(): LocalPlayer {
  if (typeof window === "undefined") return DEFAULT_PLAYER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure id exists (generate if missing from old version)
      if (!parsed.id) {
        parsed.id = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  // First visit — generate a persistent UUID
  const newPlayer = { ...DEFAULT_PLAYER, id: crypto.randomUUID() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
  return newPlayer;
}

export function usePlayer() {
  const [player, setPlayer] = useState<LocalPlayer>(DEFAULT_PLAYER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPlayer(loadPlayer());
    setIsLoaded(true);
  }, []);

  const savePlayer = useCallback((updated: LocalPlayer) => {
    // Ensure id persists
    if (!updated.id) {
      updated.id = player.id || crypto.randomUUID();
    }
    setPlayer(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [player.id]);

  const updatePlayer = useCallback(
    (partial: Partial<LocalPlayer>) => {
      const updated = { ...player, ...partial };
      savePlayer(updated);
    },
    [player, savePlayer]
  );

  const isSetUp = isLoaded && !!player.name && !!player.emoji && player.name.length >= 2;

  return { player, isLoaded, isSetUp, savePlayer, updatePlayer };
}
