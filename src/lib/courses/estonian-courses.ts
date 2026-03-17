// Hardcoded rajad — Eesti + turniiri sihtkohtade rajad
// Allikas: golf.ee, bluegolf.com, golfpass.com, golfingholiday.com

export interface EstonianCourse {
  name: string;
  city: string;
  lat: number;
  lng: number;
  holesCount: 9 | 18;
  par: number;
  holes: { number: number; par: number }[];
}

export const ESTONIAN_COURSES: EstonianCourse[] = [
  {
    name: "Otepää Golf",
    city: "Otepää",
    lat: 58.0547,
    lng: 26.4894,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 5 }, { number: 3, par: 3 },
      { number: 4, par: 4 }, { number: 5, par: 4 }, { number: 6, par: 3 },
      { number: 7, par: 4 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 5 }, { number: 14, par: 4 }, { number: 15, par: 4 },
      { number: 16, par: 3 }, { number: 17, par: 4 }, { number: 18, par: 5 },
    ],
  },
  {
    name: "Estonian Golf & Country Club",
    city: "Jõelähtme",
    lat: 59.4689,
    lng: 25.1405,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 4 }, { number: 3, par: 3 },
      { number: 4, par: 5 }, { number: 5, par: 4 }, { number: 6, par: 4 },
      { number: 7, par: 3 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 3 }, { number: 12, par: 4 },
      { number: 13, par: 5 }, { number: 14, par: 4 }, { number: 15, par: 4 },
      { number: 16, par: 3 }, { number: 17, par: 4 }, { number: 18, par: 5 },
    ],
  },
  {
    name: "Niitvälja Golf",
    city: "Niitvälja",
    lat: 59.3213,
    lng: 24.3107,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 4 }, { number: 3, par: 5 },
      { number: 4, par: 3 }, { number: 5, par: 4 }, { number: 6, par: 4 },
      { number: 7, par: 3 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 5 }, { number: 14, par: 4 }, { number: 15, par: 4 },
      { number: 16, par: 3 }, { number: 17, par: 5 }, { number: 18, par: 4 },
    ],
  },
  {
    name: "Rae Golf",
    city: "Rae",
    lat: 59.3086,
    lng: 24.9746,
    holesCount: 9,
    par: 36,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 5 }, { number: 3, par: 4 },
      { number: 4, par: 3 }, { number: 5, par: 4 }, { number: 6, par: 4 },
      { number: 7, par: 3 }, { number: 8, par: 5 }, { number: 9, par: 4 },
    ],
  },
  {
    name: "Pärnu Bay Golf Links",
    city: "Pärnu",
    lat: 58.3336,
    lng: 24.5822,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 5 }, { number: 2, par: 4 }, { number: 3, par: 4 },
      { number: 4, par: 3 }, { number: 5, par: 4 }, { number: 6, par: 5 },
      { number: 7, par: 3 }, { number: 8, par: 4 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 5 }, { number: 14, par: 4 }, { number: 15, par: 3 },
      { number: 16, par: 4 }, { number: 17, par: 5 }, { number: 18, par: 4 },
    ],
  },
  {
    name: "White Beach Golf",
    city: "Audru",
    lat: 58.3947,
    lng: 24.3785,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 5 }, { number: 3, par: 3 },
      { number: 4, par: 4 }, { number: 5, par: 4 }, { number: 6, par: 4 },
      { number: 7, par: 3 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 5 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 4 }, { number: 14, par: 4 }, { number: 15, par: 4 },
      { number: 16, par: 3 }, { number: 17, par: 5 }, { number: 18, par: 4 },
    ],
  },
  {
    name: "Saaremaa Golf",
    city: "Kuressaare",
    lat: 58.2642,
    lng: 22.4786,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 4 }, { number: 3, par: 3 },
      { number: 4, par: 5 }, { number: 5, par: 4 }, { number: 6, par: 4 },
      { number: 7, par: 3 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 5 }, { number: 14, par: 4 }, { number: 15, par: 4 },
      { number: 16, par: 3 }, { number: 17, par: 4 }, { number: 18, par: 5 },
    ],
  },
  {
    name: "Jõelähtme Golfikeskus",
    city: "Jõelähtme",
    lat: 59.4360,
    lng: 25.0580,
    holesCount: 9,
    par: 36,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 3 }, { number: 3, par: 5 },
      { number: 4, par: 4 }, { number: 5, par: 4 }, { number: 6, par: 3 },
      { number: 7, par: 4 }, { number: 8, par: 5 }, { number: 9, par: 4 },
    ],
  },

  // ── Hispaania / Girona piirkond ──
  {
    name: "Camiral Stadium Course",
    city: "Caldes de Malavella",
    lat: 41.8372,
    lng: 2.7656,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 4 }, { number: 3, par: 5 },
      { number: 4, par: 4 }, { number: 5, par: 3 }, { number: 6, par: 4 },
      { number: 7, par: 5 }, { number: 8, par: 3 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 3 }, { number: 12, par: 5 },
      { number: 13, par: 4 }, { number: 14, par: 4 }, { number: 15, par: 5 },
      { number: 16, par: 3 }, { number: 17, par: 4 }, { number: 18, par: 4 },
    ],
  },
  {
    name: "Camiral Tour Course",
    city: "Caldes de Malavella",
    lat: 41.8385,
    lng: 2.7680,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 3 }, { number: 3, par: 4 },
      { number: 4, par: 4 }, { number: 5, par: 5 }, { number: 6, par: 4 },
      { number: 7, par: 5 }, { number: 8, par: 3 }, { number: 9, par: 4 },
      { number: 10, par: 5 }, { number: 11, par: 3 }, { number: 12, par: 4 },
      { number: 13, par: 4 }, { number: 14, par: 3 }, { number: 15, par: 5 },
      { number: 16, par: 3 }, { number: 17, par: 4 }, { number: 18, par: 5 },
    ],
  },
  {
    name: "Empordà Golf Links",
    city: "Gualta",
    lat: 42.0194,
    lng: 3.1347,
    holesCount: 18,
    par: 71,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 4 }, { number: 3, par: 3 },
      { number: 4, par: 4 }, { number: 5, par: 4 }, { number: 6, par: 3 },
      { number: 7, par: 4 }, { number: 8, par: 5 }, { number: 9, par: 4 },
      { number: 10, par: 4 }, { number: 11, par: 3 }, { number: 12, par: 5 },
      { number: 13, par: 4 }, { number: 14, par: 4 }, { number: 15, par: 3 },
      { number: 16, par: 4 }, { number: 17, par: 4 }, { number: 18, par: 5 },
    ],
  },
  {
    name: "Empordà Golf Forest",
    city: "Gualta",
    lat: 42.0180,
    lng: 3.1360,
    holesCount: 18,
    par: 72,
    holes: [
      { number: 1, par: 4 }, { number: 2, par: 3 }, { number: 3, par: 4 },
      { number: 4, par: 5 }, { number: 5, par: 3 }, { number: 6, par: 4 },
      { number: 7, par: 5 }, { number: 8, par: 3 }, { number: 9, par: 5 },
      { number: 10, par: 5 }, { number: 11, par: 4 }, { number: 12, par: 3 },
      { number: 13, par: 5 }, { number: 14, par: 3 }, { number: 15, par: 4 },
      { number: 16, par: 4 }, { number: 17, par: 4 }, { number: 18, par: 4 },
    ],
  },
];

/**
 * Leia lähimad Eesti rajad GPS koordinaatide järgi.
 */
export function findNearbyEstonianCourses(
  lat: number,
  lng: number,
  maxDistanceKm: number = 100
): (EstonianCourse & { distance: number })[] {
  return ESTONIAN_COURSES.map((course) => ({
    ...course,
    distance: haversineKm(lat, lng, course.lat, course.lng),
  }))
    .filter((c) => c.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
}

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
