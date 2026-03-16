import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id]/scores — kõik skoorid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("golf_scores")
    .select("*")
    .eq("tournament_id", id)
    .order("hole_number", { ascending: true });

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

  // Support single score or batch
  const entries = Array.isArray(body) ? body : [body];

  const results = [];
  for (const entry of entries) {
    const { player_id, hole_number, strokes, entered_by, sync_id } = entry;

    if (!player_id || !hole_number || !strokes) {
      results.push({ error: "Puuduvad andmed", entry });
      continue;
    }

    const { data, error } = await supabase
      .from("golf_scores")
      .upsert(
        {
          tournament_id: tournamentId,
          player_id,
          hole_number,
          strokes,
          entered_by: entered_by || player_id,
          sync_id: sync_id || null,
        },
        { onConflict: "tournament_id,player_id,hole_number" }
      )
      .select()
      .single();

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
