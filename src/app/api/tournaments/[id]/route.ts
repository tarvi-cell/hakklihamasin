import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id] — turniiri detailid + mängijad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: tournament, error } = await supabase
    .from("golf_tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tournament) {
    return NextResponse.json(
      { error: "Turniiri ei leitud" },
      { status: 404 }
    );
  }

  // Fetch players
  const { data: tournamentPlayers } = await supabase
    .from("golf_tournament_players")
    .select(`
      id,
      player_id,
      is_td,
      flight,
      playing_handicap,
      joined_at,
      golf_players (id, name, emoji, handicap)
    `)
    .eq("tournament_id", id)
    .order("joined_at", { ascending: true });

  const players = (tournamentPlayers || []).map(
    (tp: Record<string, unknown>) => {
      const player = tp.golf_players as Record<string, unknown> | null;
      return {
        id: tp.player_id,
        name: player?.name || "Mängija",
        emoji: player?.emoji || "🏌️",
        handicap: player?.handicap ?? null,
        is_td: tp.is_td,
        flight: tp.flight,
        tp_id: tp.id,
      };
    }
  );

  return NextResponse.json({ tournament, players });
}

// PATCH /api/tournaments/[id] — uuenda turniiri (status, settings jne)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("golf_tournaments")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tournament: data });
}
