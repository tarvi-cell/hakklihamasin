import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// POST /api/tournaments/[id]/players — lisa mängija
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;
  const { player_id, name, emoji, handicap } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Nimi on kohustuslik" }, { status: 400 });
  }

  // Create/update player
  const pid = player_id || crypto.randomUUID();
  await supabase.from("golf_players").upsert(
    { id: pid, name, emoji: emoji || "🏌️", handicap: handicap ?? null },
    { onConflict: "id" }
  );

  // Add to tournament
  const { error } = await supabase
    .from("golf_tournament_players")
    .insert({
      tournament_id: tournamentId,
      player_id: pid,
      is_td: false,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Mängija juba lisatud" }, { status: 409 });
    }
    return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
  }

  return NextResponse.json({ player_id: pid });
}

// DELETE /api/tournaments/[id]/players?player_id=xxx — eemalda mängija
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;
  const playerId = request.nextUrl.searchParams.get("player_id");

  if (!playerId) {
    return NextResponse.json({ error: "player_id puudub" }, { status: 400 });
  }

  await supabase
    .from("golf_tournament_players")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("player_id", playerId);

  return NextResponse.json({ ok: true });
}
