// Dots (Garbage/Trash) format engine
// Configurable achievements: greenie, sandy, chip-in, longest_drive, closest_pin, three_putt
// Each achievement is +1 or -1 points

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

// Achievement definitions with their default point values
const DEFAULT_ACHIEVEMENTS: Record<string, { label: string; value: number }> = {
  greenie: { label: 'Greenie (GIR on par 3)', value: 1 },
  sandy: { label: 'Sandy (up & down from bunker)', value: 1 },
  chip_in: { label: 'Chip-in', value: 1 },
  longest_drive: { label: 'Longest Drive', value: 1 },
  closest_pin: { label: 'Closest to Pin', value: 1 },
  three_putt: { label: 'Three Putt', value: -1 },
  birdie: { label: 'Birdie', value: 1 },
  eagle: { label: 'Eagle', value: 2 },
  double_bogey: { label: 'Double Bogey+', value: -1 },
};

interface DotEntry {
  playerId: string;
  hole: number;
  achievement: string;
}

export const engine: FormatEngine = {
  type: 'dots',
  name: 'Dots',
  emoji: '🎲',
  description: 'Points for achievements (greenie, sandy, chip-in, etc.) and penalties (3-putt).',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    // Achievements recorded per hole per player
    const dots = Array.isArray(config.dots) ? (config.dots as DotEntry[]) : [];

    // Custom achievement values override defaults
    const achievementValues: Record<string, number> = {};
    for (const [key, def] of Object.entries(DEFAULT_ACHIEVEMENTS)) {
      achievementValues[key] = def.value;
    }
    if (typeof config.achievementValues === 'object' && config.achievementValues !== null) {
      for (const [key, val] of Object.entries(config.achievementValues as Record<string, number>)) {
        achievementValues[key] = val;
      }
    }

    // Auto-detect score-based achievements from actual scores
    const autoDots: DotEntry[] = [];
    const enableAuto = config.autoDetect !== false;

    if (enableAuto) {
      for (const ps of scores) {
        for (const sc of ps.scores) {
          const par = holePars[sc.hole - 1] ?? 0;
          if (par === 0) continue;
          const diff = sc.strokes - par;

          if (diff === -1 && achievementValues.birdie !== undefined) {
            autoDots.push({ playerId: ps.playerId, hole: sc.hole, achievement: 'birdie' });
          }
          if (diff <= -2 && achievementValues.eagle !== undefined) {
            autoDots.push({ playerId: ps.playerId, hole: sc.hole, achievement: 'eagle' });
          }
          if (diff >= 2 && achievementValues.double_bogey !== undefined) {
            autoDots.push({ playerId: ps.playerId, hole: sc.hole, achievement: 'double_bogey' });
          }
        }
      }
    }

    const allDots = [...dots, ...autoDots];

    // Tally per player
    const playerPoints: Record<string, number> = {};
    const playerAchievements: Record<string, string[]> = {};

    for (const ps of scores) {
      playerPoints[ps.playerId] = 0;
      playerAchievements[ps.playerId] = [];
    }

    for (const dot of allDots) {
      const value = achievementValues[dot.achievement] ?? 0;
      if (playerPoints[dot.playerId] !== undefined) {
        playerPoints[dot.playerId] += value;
        playerAchievements[dot.playerId].push(dot.achievement);
      }
    }

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => {
        const pts = playerPoints[ps.playerId];
        const achievements = playerAchievements[ps.playerId];

        // Summarize achievements
        const counts: Record<string, number> = {};
        for (const a of achievements) {
          counts[a] = (counts[a] || 0) + 1;
        }
        const detail = Object.entries(counts)
          .map(([key, count]) => {
            const label = DEFAULT_ACHIEVEMENTS[key]?.label ?? key;
            return count > 1 ? `${label} x${count}` : label;
          })
          .join(', ');

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: pts,
          display: `${pts} pts`,
          detail: detail || undefined,
          thru: maxThru,
        };
      })
      .sort((a, b) => b.value - a.value);
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>
  ): HoleFormatResult {
    const par = holePars[holeNumber - 1] ?? 0;
    const dots = Array.isArray(config.dots) ? (config.dots as DotEntry[]) : [];
    const holeDots = dots.filter((d) => d.hole === holeNumber);

    if (holeDots.length === 0) return { label: `Par ${par}` };

    const detail = holeDots
      .map((d) => {
        const player = scores.find((ps) => ps.playerId === d.playerId);
        const label = DEFAULT_ACHIEVEMENTS[d.achievement]?.label ?? d.achievement;
        return `${player?.playerName ?? '?'}: ${label}`;
      })
      .join(', ');

    return {
      label: `${holeDots.length} dot${holeDots.length > 1 ? 's' : ''}`,
      detail,
    };
  },
};
