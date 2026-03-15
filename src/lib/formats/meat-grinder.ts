// Meat Grinder format engine
// Config specifies format per hole segment, delegates to sub-engines
// Aggregates results across segments

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

// Direct imports of sub-engines (no circular dep since meat-grinder is a leaf)
import { engine as strokePlayEngine } from './stroke-play';
import { engine as stablefordEngine } from './stableford';
import { engine as skinsEngine } from './skins';
import { engine as matchPlayEngine } from './match-play';
import { engine as bestBallEngine } from './best-ball';
import { engine as scrambleEngine } from './scramble';
import { engine as nassauEngine } from './nassau';
import { engine as quotaEngine } from './quota';

interface Segment {
  holes: number[];
  format: string;
  config?: Record<string, unknown>;
}

const SUB_ENGINES: Record<string, FormatEngine> = {
  stroke_play: strokePlayEngine,
  stableford: stablefordEngine,
  skins: skinsEngine,
  match_play: matchPlayEngine,
  best_ball: bestBallEngine,
  scramble: scrambleEngine,
  nassau: nassauEngine,
  quota: quotaEngine,
};

function getSubEngine(formatType: string): FormatEngine | undefined {
  return SUB_ENGINES[formatType];
}

function filterScoresToHoles(scores: PlayerScores[], holes: number[]): PlayerScores[] {
  const holeSet = new Set(holes);
  return scores.map((ps) => ({
    ...ps,
    scores: ps.scores.filter((s) => holeSet.has(s.hole)),
  }));
}

function filterParsToHoles(holePars: number[], holes: number[]): number[] {
  return holes.map((h) => holePars[h - 1] ?? 0);
}

export const engine: FormatEngine = {
  type: 'meat_grinder',
  name: 'Meat Grinder',
  emoji: '🥩',
  description: 'Different format on each set of holes. The ultimate variety challenge.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const segments = Array.isArray(config.segments)
      ? (config.segments as Segment[])
      : [];

    if (segments.length === 0) return [];

    // Accumulate points per player across segments
    const playerPoints: Record<string, { total: number; details: string[] }> = {};
    for (const ps of scores) {
      playerPoints[ps.playerId] = { total: 0, details: [] };
    }

    for (const segment of segments) {
      const subEngine = getSubEngine(segment.format);
      if (!subEngine) continue;

      const segScores = filterScoresToHoles(scores, segment.holes);
      const segPars = filterParsToHoles(holePars, segment.holes);
      const segConfig = segment.config ?? {};

      const results = subEngine.calculate(segScores, segPars, segConfig, teams);

      // Normalize scores to points (rank-based)
      // Best player gets N points, worst gets 1 (for non-team formats)
      if (!subEngine.isTeamFormat) {
        const sorted = [...results];
        // Already sorted by the sub-engine

        for (let i = 0; i < sorted.length; i++) {
          const pid = sorted[i].playerId;
          if (!pid) continue;

          // Rank points: top = numPlayers, bottom = 1
          const rankPoints = sorted.length - i;

          if (playerPoints[pid]) {
            playerPoints[pid].total += rankPoints;
            const holeRange = `H${segment.holes[0]}-${segment.holes[segment.holes.length - 1]}`;
            playerPoints[pid].details.push(
              `${holeRange} ${subEngine.name}: #${i + 1}`
            );
          }
        }
      }
    }

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => {
        const data = playerPoints[ps.playerId];
        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: data.total,
          display: `${data.total} pts`,
          detail: data.details.join(' | '),
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
    const segments = Array.isArray(config.segments)
      ? (config.segments as Segment[])
      : [];

    const segment = segments.find((s) => s.holes.includes(holeNumber));
    if (!segment) return {};

    const subEngine = getSubEngine(segment.format);
    if (!subEngine) {
      return { label: segment.format };
    }

    const result = subEngine.getHoleResult(
      holeNumber,
      scores,
      holePars,
      segment.config ?? {}
    );

    return {
      label: `${subEngine.name}: ${result.label ?? ''}`.trim(),
      highlight: result.highlight,
      detail: result.detail,
    };
  },
};
