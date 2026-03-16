import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// POST /api/tournaments/join — liitu turniiriga koodi järgi
export async function POST(request: NextRequest) {
  const { share_code, player_id, name, emoji, handicap } = await request.json();

  if (!share_code || !player_id) {
    return NextResponse.json({ error: "Kood ja player_id kohustuslikud" }, { status: 400 });
  }

  // Find tournament by share code
  const { data: tournament, error: tError } = await supabase
    .from("golf_tournaments")
    .select("id, name, status")
    .eq("share_code", share_code.toUpperCase().trim())
    .single();

  if (tError || !tournament) {
    return NextResponse.json({ error: "Sellist koodi ei leitud" }, { status: 404 });
  }

  // Upsert player
  await supabase.from("golf_players").upsert(
    { id: player_id, name: name || "Mängija", emoji: emoji || "🏌️", handicap: handicap ?? null },
    { onConflict: "id" }
  );

  // Join tournament (ignore if already joined)
  await supabase
    .from("golf_tournament_players")
    .upsert(
      { tournament_id: tournament.id, player_id, is_td: false },
      { onConflict: "tournament_id,player_id" }
    );

  return NextResponse.json({ tournament_id: tournament.id, tournament_name: tournament.name });
}
