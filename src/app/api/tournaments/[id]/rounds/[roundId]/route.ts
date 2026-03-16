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

// PATCH /api/tournaments/[id]/rounds/[roundId] — uuenda ringi (status jne)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const { roundId } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("golf_rounds")
    .update(body)
    .eq("id", roundId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ round: data });
}
