"use client";

import { useState, useEffect, useCallback } from "react";

export interface TournamentData {
  id: string;
  name: string;
  share_code: string;
  status: "setup" | "active" | "completed";
  course_name: string | null;
  holes_count: number;
  hole_pars: number[];
  stroke_indices: number[] | null;
  use_flights: boolean;
  formats: string[];
  settings: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface TournamentPlayerData {
  id: string;
  name: string;
  emoji: string;
  handicap: number | null;
  is_td: boolean;
  flight: string | null;
}

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [players, setPlayers] = useState<TournamentPlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error("Turniiri ei leitud");
      const data = await res.json();
      setTournament(data.tournament);
      setPlayers(data.players || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Viga");
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  // Poll for updates every 10 seconds (simple alternative to websockets)
  useEffect(() => {
    const interval = setInterval(fetchTournament, 10000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const addPlayer = useCallback(
    async (name: string, emoji: string, handicap?: number | null) => {
      const playerId = crypto.randomUUID();
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          name,
          emoji,
          handicap: handicap ?? null,
        }),
      });
      if (res.ok) {
        await fetchTournament();
      }
      return res.ok;
    },
    [tournamentId, fetchTournament]
  );

  const removePlayer = useCallback(
    async (playerId: string) => {
      await fetch(
        `/api/tournaments/${tournamentId}/players?player_id=${playerId}`,
        { method: "DELETE" }
      );
      await fetchTournament();
    },
    [tournamentId, fetchTournament]
  );

  const updateStatus = useCallback(
    async (status: "setup" | "active" | "completed") => {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTournament((prev) => (prev ? { ...prev, status } : null));
      }
    },
    [tournamentId]
  );

  return {
    tournament,
    players,
    isLoading,
    error,
    addPlayer,
    removePlayer,
    updateStatus,
    refresh: fetchTournament,
  };
}
