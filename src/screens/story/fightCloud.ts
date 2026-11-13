import { asset } from '../../app/asset';

// Layer boxes in source px (942x1670), from scripts/build_story.py.
type Box = readonly [x: number, y: number, w: number, h: number];

export const FIGHT_BG = asset('assets/story/scene-4-bg.webp');

export const CLOUD: { src: string; box: Box; origin: readonly [number, number] } = {
  src: asset('assets/story/scene-4-cloud.webp'),
  box: [233, 990, 451, 292],
  origin: [458.1, 1148.0], // cloud centre
};

/**
 * Edge sections of the cloud. `normal` = outward direction from the cloud
 * centre (bulge direction). Motion params give each its own rhythm:
 * dur (ms), delay (ms, negative = start mid-cycle), amp (source px), rot (deg).
 */
type Lobe = {
  box: Box;
  normal: readonly [number, number];
  dur: number;
  delay: number;
  amp: number;
  rot: number;
};
const LOBE_SPECS: Lobe[] = [
  { box: [233, 1125, 90, 101], normal: [-0.983, 0.185], dur: 830, delay: -120, amp: 5, rot: -2 },
  { box: [277, 1076, 108, 58], normal: [-0.86, -0.51], dur: 1170, delay: -560, amp: 4, rot: 0 },
  { box: [414, 990, 113, 99], normal: [0.102, -0.995], dur: 970, delay: -300, amp: 6, rot: 1.5 },
  { box: [547, 1058, 117, 81], normal: [0.908, -0.42], dur: 710, delay: -40, amp: 4, rot: 0 },
  { box: [612, 1146, 64, 76], normal: [0.981, 0.196], dur: 1330, delay: -900, amp: 7, rot: 2.5 },
  { box: [301, 1214, 91, 68], normal: [-0.71, 0.704], dur: 1050, delay: -420, amp: 3.5, rot: 0 },
  { box: [503, 1221, 102, 53], normal: [0.626, 0.78], dur: 890, delay: -680, amp: 4, rot: -1.5 },
];
export const LOBES = LOBE_SPECS.map((l, i) => ({ ...l, src: asset(`assets/story/scene-4-lobe-${i + 1}.webp`) }));

type Puff = { box: Box; dur: number; delay: number; dir: 1 | -1 };
const PUFF_SPECS: Puff[] = [
  { box: [119, 1106, 76, 70], dur: 1100, delay: -200, dir: -1 },
  { box: [688, 983, 90, 70], dur: 900, delay: -500, dir: 1 },
  { box: [682, 1230, 56, 48], dur: 1250, delay: -50, dir: 1 },
];
export const PUFFS = PUFF_SPECS.map((p, i) => ({ ...p, src: asset(`assets/story/scene-4-puff-${i + 1}.webp`) }));

export const CHARS: { src: string; box: Box } = {
  src: asset('assets/story/scene-4-chars.webp'),
  box: [160, 986, 624, 269],
};

export const FIGHT_ASSETS = [FIGHT_BG, CLOUD.src, CHARS.src, ...LOBES.map((l) => l.src), ...PUFFS.map((p) => p.src)];
