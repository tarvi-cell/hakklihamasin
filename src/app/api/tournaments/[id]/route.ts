import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id] — turniiri detailid + mängijad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Vigane ID" }, { status: 400 });
  }

  const { data: tournament, error } = await supabase
    .from("golf_tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tournament) {
    return NextResponse.json({ error: "Turniiri ei leitud" }, { status: 404 });
  }

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

// PATCH /api/tournaments/[id] — uuenda turniiri (ainult lubatud väljad)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Vigane ID" }, { status: 400 });
  }

  // Whitelist — ainult need väljad on lubatud
  const ALLOWED_FIELDS = ["status", "name", "use_flights", "settings"];
  const safeUpdate: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      safeUpdate[key] = body[key];
    }
  }

  if (Object.keys(safeUpdate).length === 0) {
    return NextResponse.json({ error: "Midagi pole uuendada" }, { status: 400 });
  }

  // Valideeri status
  if (safeUpdate.status && !["setup", "active", "completed"].includes(safeUpdate.status as string)) {
    return NextResponse.json({ error: "Vigane staatus" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("golf_tournaments")
    .update(safeUpdate)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Tournament update error:", error.message);
    return NextResponse.json({ error: "Uuendamine ebaõnnestus" }, { status: 500 });
  }

  return NextResponse.json({ tournament: data });
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
