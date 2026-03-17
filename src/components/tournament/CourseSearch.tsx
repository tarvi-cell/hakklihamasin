"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Loader2,
  Navigation,
  X,
  Search,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  findNearbyCourses,
  requestGeolocation,
  type FoundCourse,
} from "@/lib/courses/course-finder";
import {
  findNearbyEstonianCourses,
  ESTONIAN_COURSES,
} from "@/lib/courses/estonian-courses";
import type { ParsedCourse } from "@/lib/courses/course-api";

interface CourseSearchProps {
  onSelect: (course: FoundCourse) => void;
}

export function CourseSearch({ onSelect }: CourseSearchProps) {
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [results, setResults] = useState<CourseOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Debounced name search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchText.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performNameSearch(searchText);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  const performNameSearch = async (query: string) => {
    setIsSearching(true);
    setError("");
    setHasSearched(true);

    const allResults: CourseOption[] = [];

    // 1. Search our own Supabase DB first (community courses)
    try {
      const dbRes = await fetch(`/api/courses?q=${encodeURIComponent(query)}`);
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        (dbData.courses || []).forEach((c: Record<string, unknown>) => {
          allResults.push({
            id: `db-${c.id}`,
            name: c.name as string,
            city: c.city as string | undefined,
            country: c.country as string | undefined,
            holesCount: (c.holes_count as number) as 9 | 18,
            totalPar: c.total_par as number,
            hasHoleData: Array.isArray(c.hole_pars) && (c.hole_pars as number[]).length > 0,
            source: "api",
            apiCourse: {
              id: `db-${c.id}`,
              name: c.name as string,
              clubName: (c.club_name as string) || "",
              city: c.city as string | undefined,
              country: c.country as string | undefined,
              holesCount: (c.holes_count as number) as 9 | 18,
              totalPar: c.total_par as number,
              holes: (c.hole_pars as number[]).map((par: number, i: number) => ({ number: i + 1, par })),
              tees: [],
              lat: c.lat as number | undefined,
              lng: c.lng as number | undefined,
            },
          });
        });
      }
    } catch { /* DB not available */ }

    // 2. Search hardcoded courses (Estonia + Spain etc)
    const hardcodedMatches = ESTONIAN_COURSES.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city.toLowerCase().includes(query.toLowerCase())
    ).map(
      (c): CourseOption => ({
        id: `hc-${c.name}`,
        name: c.name,
        city: c.city,
        country: undefined,
        holesCount: c.holesCount,
        totalPar: c.par,
        hasHoleData: c.holes.length > 0,
        source: "local",
        localCourse: c,
      })
    );
    // Add only if not already found in DB
    hardcodedMatches.forEach((hc) => {
      if (!allResults.some((r) => r.name.toLowerCase() === hc.name.toLowerCase())) {
        allResults.push(hc);
      }
    });

    // 3. Search GolfCourseAPI
    try {
      const res = await fetch(
        `/api/courses/search?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        const apiCourses: ParsedCourse[] = data.courses || [];
        apiCourses.forEach((c) => {
          // Skip if already in Estonian results
          if (
            allResults.some(
              (r) =>
                r.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 8))
            )
          )
            return;

          allResults.push({
            id: c.id,
            name: c.name,
            city: c.city,
            country: c.country,
            holesCount: c.holesCount,
            totalPar: c.totalPar,
            hasHoleData: c.holes.length > 0,
            source: "api",
            apiCourse: c,
          });
        });
      }
    } catch {
      // API not available — that's ok, we still have local results
    }

    setResults(allResults);
    setIsSearching(false);
  };

  // GPS search
  const handleGpsSearch = useCallback(async () => {
    try {
      setIsLocating(true);
      setError("");
      setHasSearched(true);

      const position = await requestGeolocation();
      const { latitude, longitude } = position.coords;

      const allResults: CourseOption[] = [];

      // Estonian courses by distance
      const nearby = findNearbyEstonianCourses(latitude, longitude, 200);
      nearby.forEach((c) => {
        allResults.push({
          id: `ee-${c.name}`,
          name: c.name,
          city: c.city,
          country: "Estonia",
          holesCount: c.holesCount,
          totalPar: c.par,
          hasHoleData: c.holes.length > 0,
          distance: c.distance,
          source: "local",
          localCourse: c,
        });
      });

      // Overpass API
      try {
        const osmCourses = await findNearbyCourses(latitude, longitude, 80000);
        osmCourses.forEach((c) => {
          if (
            allResults.some(
              (r) =>
                r.name
                  .toLowerCase()
                  .includes(c.name.toLowerCase().slice(0, 6)) ||
                c.name
                  .toLowerCase()
                  .includes(r.name.toLowerCase().slice(0, 6))
            )
          )
            return;

          allResults.push({
            id: `osm-${c.id}`,
            name: c.name,
            city: c.city,
            country: undefined,
            holesCount: c.holesCount,
            totalPar: c.totalPar,
            hasHoleData: c.holes.length > 0,
            distance: c.distance / 1000,
            source: "osm",
            osmCourse: c,
          });
        });
      } catch {
        // Overpass failed — that's fine
      }

      allResults.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      setResults(allResults);

      if (allResults.length === 0) {
        setError("Ei leidnud läheduses radasid. Proovi nime järgi otsida.");
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Asukoha luba keelatud."
            : "Asukoht pole kättesaadav."
        );
      } else {
        setError("GPS otsing ebaõnnestus.");
      }
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleSelect = (course: CourseOption) => {
    if (course.localCourse) {
      const c = course.localCourse;
      onSelect({
        id: 0,
        name: c.name,
        city: c.city,
        holesCount: c.holesCount,
        totalPar: c.par,
        holes: c.holes.map((h) => ({ number: h.number, par: h.par })),
        lat: c.lat,
        lng: c.lng,
        distance: (course.distance ?? 0) * 1000,
      });
    } else if (course.apiCourse) {
      const c = course.apiCourse;
      onSelect({
        id: Number(c.id.replace("api-", "")),
        name: c.name,
        city: c.city,
        holesCount: c.holesCount,
        totalPar: c.totalPar,
        holes: c.holes.map((h) => ({
          number: h.number,
          par: h.par,
          si: h.si,
        })),
        lat: c.lat ?? 0,
        lng: c.lng ?? 0,
        distance: 0,
      });
    } else if (course.osmCourse) {
      onSelect(course.osmCourse);
    }

    // Save course to our DB for future searches (fire and forget)
    const selectedData = course.localCourse
      ? {
          name: course.localCourse.name,
          city: course.localCourse.city,
          lat: course.localCourse.lat,
          lng: course.localCourse.lng,
          holes_count: course.localCourse.holesCount,
          total_par: course.localCourse.par,
          hole_pars: course.localCourse.holes.map((h) => h.par),
          source: "hardcoded",
        }
      : course.apiCourse
      ? {
          name: course.apiCourse.name,
          club_name: course.apiCourse.clubName,
          city: course.apiCourse.city,
          country: course.apiCourse.country,
          lat: course.apiCourse.lat,
          lng: course.apiCourse.lng,
          holes_count: course.apiCourse.holesCount,
          total_par: course.apiCourse.totalPar,
          hole_pars: course.apiCourse.holes.map((h) => h.par),
          source: "golfcourseapi",
        }
      : course.osmCourse
      ? {
          name: course.osmCourse.name,
          city: course.osmCourse.city,
          lat: course.osmCourse.lat,
          lng: course.osmCourse.lng,
          holes_count: course.osmCourse.holesCount,
          total_par: course.osmCourse.totalPar,
          hole_pars: course.osmCourse.holes.map((h) => h.par),
          source: "osm",
        }
      : null;

    if (selectedData && selectedData.hole_pars.length > 0) {
      fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedData),
      }).catch(() => {}); // silent fail
    }

    // Clear search
    setSearchText("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-3">
      {/* Name search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Otsi raja nime järgi..."
          className="pl-9 pr-10 h-12 rounded-xl bg-card text-base"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {searchText && !isSearching && (
          <button
            onClick={() => {
              setSearchText("");
              setResults([]);
              setHasSearched(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* GPS button */}
      <Button
        variant="outline"
        onClick={handleGpsSearch}
        disabled={isLocating}
        className="w-full h-10 gap-2 rounded-xl"
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {isLocating ? "Otsin asukohta..." : "Leia rada GPS-iga"}
      </Button>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
          <AnimatePresence>
            {results.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-all"
                  onClick={() => handleSelect(course)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {course.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {course.city && <span>{course.city}</span>}
                          {course.country && <span>{course.country}</span>}
                          {course.distance != null && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {course.distance.toFixed(0)} km
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {course.holesCount && (
                          <Badge variant="outline" className="text-[10px]">
                            {course.holesCount} auku
                          </Badge>
                        )}
                        {course.totalPar && (
                          <Badge variant="secondary" className="text-[10px]">
                            Par {course.totalPar}
                          </Badge>
                        )}
                        {course.hasHoleData && (
                          <Badge
                            variant="default"
                            className="text-[10px] bg-birdie"
                          >
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Parid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No results */}
      {hasSearched && results.length === 0 && !isSearching && !isLocating && !error && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Ei leidnud radasid. Proovi teist otsisõna.
        </p>
      )}
    </div>
  );
}

// Internal type
interface CourseOption {
  id: string;
  name: string;
  city?: string;
  country?: string;
  holesCount: 9 | 18 | null;
  totalPar: number | null;
  hasHoleData: boolean;
  distance?: number;
  source: "local" | "api" | "osm";
  localCourse?: import("@/lib/courses/estonian-courses").EstonianCourse;
  apiCourse?: ParsedCourse;
  osmCourse?: FoundCourse;
}
