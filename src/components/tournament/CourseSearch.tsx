"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Navigation, X, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  findNearbyCourses,
  requestGeolocation,
  type FoundCourse,
} from "@/lib/courses/course-finder";
import {
  findNearbyEstonianCourses,
  type EstonianCourse,
} from "@/lib/courses/estonian-courses";

// Unified course type for the UI
interface CourseOption {
  id: string;
  name: string;
  city?: string;
  holesCount: 9 | 18 | null;
  totalPar: number | null;
  hasHoleData: boolean;
  distance: number;
  source: "local" | "osm";
  // Original data for selection
  localCourse?: EstonianCourse;
  osmCourse?: FoundCourse;
}

interface CourseSearchProps {
  onSelect: (course: FoundCourse) => void;
}

export function CourseSearch({ onSelect }: CourseSearchProps) {
  const [status, setStatus] = useState<
    "idle" | "locating" | "searching" | "results" | "error"
  >("idle");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async () => {
    try {
      setStatus("locating");
      setError("");

      const position = await requestGeolocation();
      const { latitude, longitude } = position.coords;

      setStatus("searching");

      // 1. First: local Estonian courses (instant, always works)
      const estonianResults = findNearbyEstonianCourses(
        latitude,
        longitude,
        150
      ).map(
        (c): CourseOption => ({
          id: `local-${c.name}`,
          name: c.name,
          city: c.city,
          holesCount: c.holesCount,
          totalPar: c.par,
          hasHoleData: c.holes.length > 0,
          distance: c.distance,
          source: "local",
          localCourse: c,
        })
      );

      // 2. Then: Overpass API (slower, may fail)
      let osmResults: CourseOption[] = [];
      try {
        const osmCourses = await findNearbyCourses(
          latitude,
          longitude,
          80000
        );
        osmResults = osmCourses
          .filter(
            (c) =>
              // Don't duplicate courses that are already in local list
              !estonianResults.some(
                (e) =>
                  e.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 8)) ||
                  c.name.toLowerCase().includes(e.name.toLowerCase().slice(0, 8))
              )
          )
          .map(
            (c): CourseOption => ({
              id: `osm-${c.id}`,
              name: c.name,
              city: c.city,
              holesCount: c.holesCount,
              totalPar: c.totalPar,
              hasHoleData: c.holes.length > 0,
              distance: c.distance / 1000, // convert m to km
              source: "osm",
              osmCourse: c,
            })
          );
      } catch {
        // OSM failed — that's fine, we still have local courses
      }

      // Merge and sort by distance
      const merged = [...estonianResults, ...osmResults].sort(
        (a, b) => a.distance - b.distance
      );

      setCourses(merged);
      setStatus("results");

      if (merged.length === 0) {
        setError("Ei leidnud läheduses golfirada.");
      }
    } catch (err) {
      setStatus("error");
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Asukoha luba keelatud. Luba see brauseri seadetes.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Asukoht pole kättesaadav.");
            break;
          case err.TIMEOUT:
            setError("Asukoha päring aegus. Proovi uuesti.");
            break;
        }
      } else {
        setError("Otsing ebaõnnestus.");
      }
    }
  }, []);

  const handleSelect = (course: CourseOption) => {
    if (course.localCourse) {
      // Convert local Estonian course to FoundCourse format
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
        distance: course.distance * 1000,
      });
    } else if (course.osmCourse) {
      onSelect(course.osmCourse);
    }
  };

  return (
    <div className="space-y-3">
      {status === "idle" && (
        <Button
          variant="outline"
          onClick={handleSearch}
          className="w-full h-11 gap-2"
        >
          <Navigation className="w-4 h-4" />
          Leia rada GPS-iga
        </Button>
      )}

      {(status === "locating" || status === "searching") && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {status === "locating"
              ? "Otsin asukohta..."
              : "Otsin lähimaid radu..."}
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-3">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleSearch}>
            Proovi uuesti
          </Button>
        </div>
      )}

      {status === "results" && courses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Leitud {courses.length} rada
            </p>
            <button
              onClick={() => { setStatus("idle"); setCourses([]); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            <AnimatePresence>
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
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
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {course.distance < 1
                                ? `${Math.round(course.distance * 1000)} m`
                                : `${course.distance.toFixed(1)} km`}
                            </span>
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
                              Parid olemas
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
        </div>
      )}

      {status === "results" && courses.length === 0 && (
        <div className="text-center py-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={handleSearch} className="mt-2">
            Proovi uuesti
          </Button>
        </div>
      )}
    </div>
  );
}
