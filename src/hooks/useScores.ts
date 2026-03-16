"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ScoreEntry {
  player_id: string;
  hole_number: number;
  strokes: number;
  entered_by?: string;
  sync_id?: string;
}

const QUEUE_KEY = "hakklihamasin-offline-queue";

export function useScores(tournamentId: string) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const pollRef = useRef<NodeJS.Timeout>(null);

  // Fetch all scores
  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/scores`);
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores || []);
        // Cache locally
        localStorage.setItem(
          `hakklihamasin-scores-${tournamentId}`,
          JSON.stringify(data.scores || [])
        );
      }
    } catch {
      // Offline — load from cache
      const cached = localStorage.getItem(
        `hakklihamasin-scores-${tournamentId}`
      );
      if (cached) setScores(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  // Initial fetch
  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Poll every 5 seconds for other players' scores
  useEffect(() => {
    pollRef.current = setInterval(fetchScores, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchScores]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load pending count
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    setPendingCount(queue.length);
  }, []);

  // Set a score (optimistic + API + queue)
  const setScore = useCallback(
    async (
      playerId: string,
      holeNumber: number,
      strokes: number,
      enteredBy?: string
    ) => {
      const entry: ScoreEntry = {
        player_id: playerId,
        hole_number: holeNumber,
        strokes,
        entered_by: enteredBy || playerId,
        sync_id: crypto.randomUUID(),
      };

      // Optimistic local update
      setScores((prev) => {
        const idx = prev.findIndex(
          (s) =>
            s.player_id === playerId && s.hole_number === holeNumber
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...entry };
          return updated;
        }
        return [...prev, entry];
      });

      // Try API
      try {
        const res = await fetch(
          `/api/tournaments/${tournamentId}/scores`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          }
        );
        if (!res.ok) throw new Error("API error");
      } catch {
        // Offline — add to queue
        addToQueue({ ...entry, tournament_id: tournamentId });
      }

      // Update local cache
      const cached = JSON.parse(
        localStorage.getItem(`hakklihamasin-scores-${tournamentId}`) ||
          "[]"
      );
      const cIdx = cached.findIndex(
        (s: ScoreEntry) =>
          s.player_id === playerId && s.hole_number === holeNumber
      );
      if (cIdx >= 0) {
        cached[cIdx] = entry;
      } else {
        cached.push(entry);
      }
      localStorage.setItem(
        `hakklihamasin-scores-${tournamentId}`,
        JSON.stringify(cached)
      );
    },
    [tournamentId]
  );

  // Offline queue
  const addToQueue = (data: ScoreEntry & { tournament_id: string }) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(data);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setPendingCount(queue.length);
  };

  const processQueue = async () => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      try {
        const res = await fetch(
          `/api/tournaments/${item.tournament_id}/scores`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          }
        );
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setPendingCount(remaining.length);

    if (remaining.length < queue.length) {
      // Some synced — refresh scores
      fetchScores();
    }
  };

  // Get score for specific player + hole
  const getScore = useCallback(
    (playerId: string, holeNumber: number): number | null => {
      const s = scores.find(
        (s) => s.player_id === playerId && s.hole_number === holeNumber
      );
      return s?.strokes ?? null;
    },
    [scores]
  );

  return {
    scores,
    isLoading,
    isOnline,
    pendingCount,
    setScore,
    getScore,
    refresh: fetchScores,
  };
}
