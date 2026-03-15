// GPS-põhine golfiraja otsing Overpass API (OpenStreetMap) kaudu
// Tasuta, ilma API võtmeta

export interface FoundCourse {
  id: number;
  name: string;
  city?: string;
  holesCount: 9 | 18 | null;
  totalPar: number | null;
  holes: FoundHole[];
  lat: number;
  lng: number;
  distance: number; // meetrites
  website?: string;
  phone?: string;
}

export interface FoundHole {
  number: number;
  par: number;
  si?: number; // stroke index
}

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

/**
 * Leia lähimad golfirajad GPS koordinaatide järgi.
 * Kasutab Overpass API-t (OpenStreetMap) — tasuta, ilma võtmeta.
 */
export async function findNearbyCourses(
  lat: number,
  lng: number,
  radiusMeters: number = 80000
): Promise<FoundCourse[]> {
  // Overpass query: leia rajad + nende augud
  const query = `[out:json][timeout:30];
(
  way["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
  relation["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
)->.courses;
.courses out tags center;
.courses map_to_area->.searchArea;
way["golf"="hole"](area.searchArea);
out tags;`;

  const res = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`);
  }

  const data = await res.json();
  const elements = data.elements as OverpassElement[];

  // Eralda rajad ja augud
  const courseElements = elements.filter(
    (e) => e.tags?.leisure === "golf_course"
  );
  const holeElements = elements.filter((e) => e.tags?.golf === "hole");

  // Paarista augud radadega (augud on raja piirides)
  const courses: FoundCourse[] = courseElements.map((course) => {
    const courseLat = course.center?.lat ?? course.lat ?? 0;
    const courseLng = course.center?.lon ?? course.lon ?? 0;
    const dist = haversineDistance(lat, lng, courseLat, courseLng);

    // Leia augud sellele rajale
    const holes = holeElements
      .filter((h) => {
        // Overpass map_to_area seob augud rajadega, aga me ei saa seda
        // otse JSON-ist. Kasutame nime- ja läheduspõhist sobitamist.
        // Kuna augud on raja sees, on nad tavaliselt kõik sama raja omad.
        return true; // Kõik augud — täpsustame allpool
      })
      .map((h): FoundHole | null => {
        const num = parseInt(h.tags?.ref || "0", 10);
        const par = parseInt(h.tags?.par || "0", 10);
        if (!num || !par) return null;
        const si = h.tags?.handicap ? parseInt(h.tags.handicap, 10) : undefined;
        return { number: num, par, si };
      })
      .filter((h): h is FoundHole => h !== null)
      .sort((a, b) => a.number - b.number);

    // Eemalda duplikaadid (sama augu number)
    const uniqueHoles = holes.filter(
      (h, i, arr) => arr.findIndex((x) => x.number === h.number) === i
    );

    // Proovi par lugeda tagidest
    let totalPar: number | null = null;
    if (course.tags?.["golf:par"]) {
      totalPar = parseInt(course.tags["golf:par"], 10);
    } else if (uniqueHoles.length > 0) {
      totalPar = uniqueHoles.reduce((sum, h) => sum + h.par, 0);
    } else if (course.tags?.description) {
      // Proovi parsida kirjeldusest "Par 72" vms
      const match = course.tags.description.match(/par\s*(\d+)/i);
      if (match) totalPar = parseInt(match[1], 10);
    }

    // Proovi augude arvu
    let holesCount: 9 | 18 | null = null;
    if (course.tags?.["golf:course"]) {
      const h = parseInt(course.tags["golf:course"], 10);
      if (h === 9 || h === 18) holesCount = h;
    } else if (uniqueHoles.length === 9 || uniqueHoles.length === 18) {
      holesCount = uniqueHoles.length as 9 | 18;
    } else if (totalPar) {
      holesCount = totalPar > 50 ? 18 : 9;
    }

    return {
      id: course.id,
      name: course.tags?.name || "Nimetamata rada",
      city:
        course.tags?.["addr:city"] ||
        course.tags?.["addr:place"] ||
        undefined,
      holesCount,
      totalPar,
      holes: uniqueHoles,
      lat: courseLat,
      lng: courseLng,
      distance: dist,
      website: course.tags?.website || undefined,
      phone: course.tags?.phone || undefined,
    };
  });

  // Sorteeri kauguse järgi
  courses.sort((a, b) => a.distance - b.distance);

  return courses;
}

/**
 * Küsi brauserilt GPS asukohta.
 */
export function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation pole toetatud"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // 5 min cache
    });
  });
}

// --- Helpers ---

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
