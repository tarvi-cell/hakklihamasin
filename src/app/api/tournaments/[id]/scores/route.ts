import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id]/scores?round_id=xxx — skoorid (ringi või kogu turniiri)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roundId = request.nextUrl.searchParams.get("round_id");

  let query = supabase
    .from("golf_scores")
    .select("*")
    .eq("tournament_id", id)
    .order("hole_number", { ascending: true });

  if (roundId) {
    query = query.eq("round_id", roundId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scores: data || [] });
}

// POST /api/tournaments/[id]/scores — sisesta/uuenda skoor (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;
  const body = await request.json();

  const entries = Array.isArray(body) ? body : [body];

  const results = [];
  for (const entry of entries) {
    const { player_id, hole_number, strokes, entered_by, sync_id, round_id } = entry;

    if (!player_id || !hole_number || !strokes) {
      results.push({ error: "Puuduvad andmed", entry });
      continue;
    }

    const scoreData: Record<string, unknown> = {
      tournament_id: tournamentId,
      player_id,
      hole_number,
      strokes,
      entered_by: entered_by || player_id,
      sync_id: sync_id || null,
      round_id: round_id || null,
    };

    const conflictTarget = round_id
      ? "round_id,player_id,hole_number"
      : "idx_golf_scores_tournament_player_hole";

    // For round-based scores, use the round constraint
    // For legacy scores without round, use the partial index
    let data, error;
    if (round_id) {
      ({ data, error } = await supabase
        .from("golf_scores")
        .upsert(scoreData, { onConflict: "round_id,player_id,hole_number" })
        .select()
        .single());
    } else {
      // Check if score exists, then update or insert
      const { data: existing } = await supabase
        .from("golf_scores")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("player_id", player_id)
        .eq("hole_number", hole_number)
        .is("round_id", null)
        .maybeSingle();

      if (existing) {
        ({ data, error } = await supabase
          .from("golf_scores")
          .update({ strokes, entered_by: entered_by || player_id, sync_id: sync_id || null })
          .eq("id", existing.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from("golf_scores")
          .insert(scoreData)
          .select()
          .single());
      }
    }

    if (error) {
      results.push({ error: error.message, entry });
    } else {
      results.push({ ok: true, score: data });
    }
  }

  return NextResponse.json({
    results,
    success: results.filter((r) => "ok" in r).length,
    failed: results.filter((r) => "error" in r).length,
  });
}
