import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// GET /api/courses?q=Camiral — otsi radasid meie DB-st
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ courses: [] });
  }

  // Search by name (case-insensitive, partial match)
  const { data, error } = await supabase
    .from("golf_courses")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
  }

  return NextResponse.json({ courses: data || [] });
}

// POST /api/courses — salvesta rada meie DB-sse
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, club_name, city, country, lat, lng, holes_count, total_par, hole_pars, stroke_indices, source, created_by } = body;

  if (!name || !hole_pars || !total_par) {
    return NextResponse.json({ error: "name, hole_pars ja total_par kohustuslikud" }, { status: 400 });
  }

  // Check if course already exists (by name + city, to avoid duplicates)
  const { data: existing } = await supabase
    .from("golf_courses")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("golf_courses")
      .update({
        club_name, city, country, lat, lng, holes_count, total_par,
        hole_pars, stroke_indices, source: source || "user",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
    return NextResponse.json({ course: data, updated: true });
  }

  // Insert new
  const { data, error } = await supabase
    .from("golf_courses")
    .insert({
      name, club_name, city, country, lat, lng,
      holes_count: holes_count || 18,
      total_par, hole_pars,
      stroke_indices: stroke_indices || null,
      source: source || "user",
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Serveri viga" }, { status: 500 });
  return NextResponse.json({ course: data, created: true });
}
