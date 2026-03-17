import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/tournaments/[id]/rounds — kõik ringid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("golf_rounds")
    .select("*")
    .eq("tournament_id", id)
    .order("round_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
  }

  return NextResponse.json({ rounds: data || [] });
}

// POST /api/tournaments/[id]/rounds — lisa uus ring
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;
  const body = await request.json();

  const {
    round_number,
    name,
    course_name,
    holes_count,
    hole_pars,
    stroke_indices,
    formats,
    settings,
  } = body;

  if (!hole_pars || !round_number) {
    return NextResponse.json({ error: "hole_pars ja round_number kohustuslikud" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("golf_rounds")
    .insert({
      tournament_id: tournamentId,
      round_number,
      name: name || `Ring ${round_number}`,
      course_name: course_name || null,
      holes_count: holes_count || 18,
      hole_pars,
      stroke_indices: stroke_indices || null,
      formats: formats || ["stroke_play"],
      settings: settings || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
  }

  return NextResponse.json({ round: data });
}
