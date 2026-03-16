import { NextRequest, NextResponse } from "next/server";
import { searchCoursesByName } from "@/lib/courses/course-api";

// Map common ASCII to diacritics and vice versa for search
const DIACRITIC_MAP: [string, string][] = [
  ["a", "ä"], ["o", "ö"], ["u", "ü"], ["o", "õ"],
  ["ä", "a"], ["ö", "o"], ["ü", "u"], ["õ", "o"],
];

function generateDiacriticVariants(query: string): string[] {
  const variants = new Set<string>();
  variants.add(query);

  // Try replacing each character with its diacritic variant
  for (const [from, to] of DIACRITIC_MAP) {
    if (query.toLowerCase().includes(from)) {
      variants.add(query.replace(new RegExp(from, "gi"), to));
    }
  }

  return Array.from(variants);
}

const API_KEY = process.env.GOLF_COURSE_API_KEY || "";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ courses: [] });
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Golf Course API key not configured" },
      { status: 503 }
    );
  }

  try {
    // Search with original query
    let courses = await searchCoursesByName(query, API_KEY);

    // If few results, also try with Estonian diacritics variants
    if (courses.length < 3) {
      const variants = generateDiacriticVariants(query);
      for (const variant of variants) {
        if (variant !== query) {
          const more = await searchCoursesByName(variant, API_KEY);
          // Add non-duplicate results
          for (const c of more) {
            if (!courses.some((existing) => existing.id === c.id)) {
              courses.push(c);
            }
          }
        }
      }
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Course search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
