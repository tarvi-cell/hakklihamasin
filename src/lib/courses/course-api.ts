// GolfCourseAPI.com integration — 30,000 rada, aukude parid olemas
// Tasuta: 300 req/päev

export interface ApiCourse {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees: {
    male?: ApiTee[];
    female?: ApiTee[];
  };
}

export interface ApiTee {
  tee_name: string;
  course_rating?: number;
  slope_rating?: number;
  total_yards?: number;
  total_meters?: number;
  number_of_holes: number;
  par_total: number;
  holes?: ApiHole[];
}

export interface ApiHole {
  par: number;
  yardage?: number;
  handicap?: number;
}

export interface ParsedCourse {
  id: string;
  name: string;
  clubName: string;
  city?: string;
  country?: string;
  holesCount: 9 | 18;
  totalPar: number;
  holes: { number: number; par: number; si?: number; yards?: number }[];
  tees: { name: string; par: number; yards?: number }[];
  lat?: number;
  lng?: number;
}

const API_BASE = "https://api.golfcourseapi.com/v1";

/**
 * Otsi radasid nime järgi. Tagastab kuni 25 tulemust.
 */
export async function searchCoursesByName(
  query: string,
  apiKey: string
): Promise<ParsedCourse[]> {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `${API_BASE}/search?search_query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Key ${apiKey}` },
    }
  );

  if (!res.ok) {
    console.error("GolfCourseAPI error:", res.status);
    return [];
  }

  const data = await res.json();
  const courses: ApiCourse[] = data.courses || [];

  return courses.map(parseCourse).filter((c): c is ParsedCourse => c !== null);
}

function parseCourse(course: ApiCourse): ParsedCourse | null {
  // Prefer male tees, fallback to female
  const teeList = course.tees?.male || course.tees?.female || [];
  if (teeList.length === 0) return null;

  // Find the tee with hole data, preferring the first one
  const teeWithHoles = teeList.find((t) => t.holes && t.holes.length > 0);
  const primaryTee = teeWithHoles || teeList[0];

  const holesCount = primaryTee.number_of_holes;
  if (holesCount !== 9 && holesCount !== 18) return null;

  // Parse hole data
  const holes: ParsedCourse["holes"] = [];
  if (primaryTee.holes && primaryTee.holes.length > 0) {
    primaryTee.holes.forEach((h, i) => {
      holes.push({
        number: i + 1,
        par: h.par,
        si: h.handicap || undefined,
        yards: h.yardage || undefined,
      });
    });
  }

  // Parse all tee options
  const tees = teeList.map((t) => ({
    name: t.tee_name,
    par: t.par_total,
    yards: t.total_yards || undefined,
  }));

  return {
    id: `api-${course.id}`,
    name: course.course_name || course.club_name,
    clubName: course.club_name,
    city: course.location?.city || undefined,
    country: course.location?.country || undefined,
    holesCount: holesCount as 9 | 18,
    totalPar: primaryTee.par_total,
    holes,
    tees,
    lat: course.location?.latitude || undefined,
    lng: course.location?.longitude || undefined,
  };
}
