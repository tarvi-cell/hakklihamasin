"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Navigation, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  findNearbyCourses,
  requestGeolocation,
  type FoundCourse,
} from "@/lib/courses/course-finder";

interface CourseSearchProps {
  onSelect: (course: FoundCourse) => void;
}

export function CourseSearch({ onSelect }: CourseSearchProps) {
  const [status, setStatus] = useState<
    "idle" | "locating" | "searching" | "results" | "error"
  >("idle");
  const [courses, setCourses] = useState<FoundCourse[]>([]);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async () => {
    try {
      setStatus("locating");
      setError("");

      const position = await requestGeolocation();
      const { latitude, longitude } = position.coords;

      setStatus("searching");

      const found = await findNearbyCourses(latitude, longitude, 25000);
      setCourses(found);
      setStatus("results");

      if (found.length === 0) {
        setError("Ei leidnud läheduses golfirada. Proovi käsitsi sisestada.");
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
        setError("Radade otsing ebaõnnestus. Kontrolli internetiühendust.");
      }
    }
  }, []);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
          >
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
              onClick={() => {
                setStatus("idle");
                setCourses([]);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
            <AnimatePresence>
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-all"
                    onClick={() => onSelect(course)}
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
                              {formatDistance(course.distance)}
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
                          {course.holes.length > 0 && (
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            className="mt-2"
          >
            Proovi uuesti
          </Button>
        </div>
      )}
    </div>
  );
}
