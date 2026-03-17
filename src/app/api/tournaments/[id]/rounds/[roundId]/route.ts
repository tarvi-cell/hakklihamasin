import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id]/rounds/[roundId] — ringi detailid + skoorid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const { roundId } = await params;

  const { data: round, error } = await supabase
    .from("golf_rounds")
    .select("*")
    .eq("id", roundId)
    .single();

  if (error || !round) {
    return NextResponse.json({ error: "Ringi ei leitud" }, { status: 404 });
  }

  const { data: scores } = await supabase
    .from("golf_scores")
    .select("*")
    .eq("round_id", roundId)
    .order("hole_number", { ascending: true });

  return NextResponse.json({ round, scores: scores || [] });
}

// PATCH /api/tournaments/[id]/rounds/[roundId] — uuenda ringi (ainult lubatud väljad)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const { roundId } = await params;
  const body = await request.json();

  // Whitelist
  const ALLOWED_FIELDS = ["status", "name", "settings"];
  const safeUpdate: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) safeUpdate[key] = body[key];
  }

  if (Object.keys(safeUpdate).length === 0) {
    return NextResponse.json({ error: "Midagi pole uuendada" }, { status: 400 });
  }

  if (safeUpdate.status && !["setup", "active", "completed"].includes(safeUpdate.status as string)) {
    return NextResponse.json({ error: "Vigane staatus" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("golf_rounds")
    .update(safeUpdate)
    .eq("id", roundId)
    .select()
    .single();

  if (error) {
    console.error("Round update error:", error.message);
    return NextResponse.json({ error: "Uuendamine ebaõnnestus" }, { status: 500 });
  }

  return NextResponse.json({ round: data });
}
