// Format engine registry
// Central registry mapping all format types to their engines

import type { FormatEngine } from './types';

import { engine as strokePlayEngine } from './stroke-play';
import { engine as stablefordEngine } from './stableford';
import { engine as skinsEngine } from './skins';
import { engine as matchPlayEngine } from './match-play';
import { engine as bestBallEngine } from './best-ball';
import { engine as scrambleEngine } from './scramble';
import { engine as nassauEngine } from './nassau';
import { engine as meatGrinderEngine } from './meat-grinder';
import { engine as quotaEngine } from './quota';
import { engine as dotsEngine } from './dots';
import { engine as wolfEngine } from './wolf';
import { engine as shambleEngine } from './shamble';

export const FORMAT_REGISTRY: Record<string, FormatEngine> = {
  stroke_play: strokePlayEngine,
  stableford: stablefordEngine,
  skins: skinsEngine,
  match_play: matchPlayEngine,
  best_ball: bestBallEngine,
  scramble: scrambleEngine,
  nassau: nassauEngine,
  meat_grinder: meatGrinderEngine,
  quota: quotaEngine,
  dots: dotsEngine,
  wolf: wolfEngine,
  shamble: shambleEngine,
};

export function getFormatEngine(type: string): FormatEngine | undefined {
  return FORMAT_REGISTRY[type];
}

export interface FormatMeta {
  type: string;
  name: string;
  emoji: string;
  description: string;
  isTeamFormat: boolean;
}

export function getAllFormats(): FormatMeta[] {
  return Object.values(FORMAT_REGISTRY).map((engine) => ({
    type: engine.type,
    name: engine.name,
    emoji: engine.emoji,
    description: engine.description,
    isTeamFormat: engine.isTeamFormat,
  }));
}
