import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments?player_id=xxx — turniiri nimekiri mängija järgi
export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("player_id");

  if (playerId) {
    // Turnirid kus mängija osaleb
    const { data, error } = await supabase
      .from("golf_tournament_players")
      .select(`
        tournament_id,
        is_td,
        golf_tournaments (*)
      `)
      .eq("player_id", playerId)
      .order("joined_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
    }

    const tournaments = (data || [])
      .map((tp: Record<string, unknown>) => ({
        ...(tp.golf_tournaments as Record<string, unknown>),
        is_td: tp.is_td,
      }))
      .filter((t: Record<string, unknown>) => t.id);

    return NextResponse.json({ tournaments });
  }

  return NextResponse.json({ tournaments: [] });
}

// POST /api/tournaments — loo turniir
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    course_name,
    holes_count,
    hole_pars,
    stroke_indices,
    use_flights,
    formats,
    settings,
    player_id,
    player_name,
    player_emoji,
    player_handicap,
  } = body;

  if (!name || !hole_pars || !player_id) {
    return NextResponse.json({ error: "Puuduvad andmed" }, { status: 400 });
  }

  // Upsert player
  await supabase.from("golf_players").upsert(
    {
      id: player_id,
      name: player_name || "Mängija",
      emoji: player_emoji || "🏌️",
      handicap: player_handicap ?? null,
    },
    { onConflict: "id" }
  );

  // Generate unique share code with retry
  let shareCode = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    shareCode = generateShareCode();
    const { data: existing } = await supabase
      .from("golf_tournaments")
      .select("id")
      .eq("share_code", shareCode)
      .maybeSingle();
    if (!existing) break;
  }

  // Create tournament
  const { data: tournament, error: tError } = await supabase
    .from("golf_tournaments")
    .insert({
      name,
      share_code: shareCode,
      course_name: course_name || null,
      holes_count: holes_count || 18,
      hole_pars,
      stroke_indices: stroke_indices || null,
      use_flights: use_flights || false,
      formats: formats || ["stroke_play"],
      settings: settings || {},
      created_by: player_id,
    })
    .select()
    .single();

  if (tError || !tournament) {
    return NextResponse.json(
      { error: tError?.message || "Turniiri loomine ebaõnnestus" },
      { status: 500 }
    );
  }

  // Add creator as TD
  await supabase.from("golf_tournament_players").insert({
    tournament_id: tournament.id,
    player_id,
    is_td: true,
  });

  return NextResponse.json({ tournament });
}

function generateShareCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
