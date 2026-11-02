// Registry of the small canvas animations shown by Stage.svelte on showcase pages.
import { stages as aquaStages, stillTime as aquaStill, type AquaKind } from './aqua-stages';
import { stages as mazeStages, stillTime as mazeStill, type MazeKind } from './maze-stages';
import type { StageArgs } from './stage-kit';

export type StageKind = AquaKind | MazeKind;

export const stages: Record<StageKind, (args: StageArgs) => void> = { ...aquaStages, ...mazeStages };
export const stillTime: Record<StageKind, number> = { ...aquaStill, ...mazeStill };
