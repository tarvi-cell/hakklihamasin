"use client";

import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Trophy, BarChart3, Beer } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "scorecard", label: "Skoor", icon: ClipboardList },
  { href: "leaderboard", label: "Edetabel", icon: Trophy },
  { href: "stats", label: "Statistika", icon: BarChart3 },
  { href: "19th-hole", label: "19. auk", icon: Beer },
];

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show bottom nav on the hub page (tournament/[id] without subpage)
  const segments = pathname.split("/").filter(Boolean);
  const isHubPage = segments.length === 2; // ["tournament", "[id]"]

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div
        className={cn("flex-1 overflow-y-auto", !isHubPage && "pb-[72px]")}
        style={!isHubPage ? { paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" } : undefined}
      >
        {children}
      </div>

      {!isHubPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.endsWith(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    const basePath = pathname
                      .split("/")
                      .slice(0, 3)
                      .join("/");
                    router.push(`${basePath}/${item.href}`);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2.5 px-5 min-w-[72px] transition-colors relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
