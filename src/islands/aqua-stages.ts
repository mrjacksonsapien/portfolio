// Drawing code for the small animations on the Aquamania page, one function per kind (see Stage.svelte).
// Each is a pure function of time `t` (seconds), drawn in the foreground color at varying opacity.

import { smoothstep, lerp, label, type StageArgs } from './stage-kit';

export type AquaKind = 'regions' | 'serializer';

// What each region feels like: how bright the water is and how busy the sound is.
const REGIONS = [
  { name: 'shallows', light: 0.9, amp: 0.25, freq: 2 },
  { name: 'reef', light: 0.5, amp: 0.55, freq: 4 },
  { name: 'abyss', light: 0.12, amp: 0.9, freq: 7 },
];

/** A diver crosses three regions; light and sound blend across the zones between them instead of switching. */
function regions({ g, w, h, t, font }: StageArgs) {
  const fs = Math.max(10, w / 34);
  const pad = w * 0.07;
  const left = pad;
  const width = w - pad * 2;
  const trackTop = h * 0.14;
  const trackH = h * 0.22;
  const halfZone = 0.07; // blend zone half-width, as a fraction of the track

  // The diver swims there and back, resting a moment at both ends.
  const u = (t / 9) % 2;
  const swim = smoothstep(0.08, 0.92, u < 1 ? u : 2 - u);

  const s1 = smoothstep(1 / 3 - halfZone, 1 / 3 + halfZone, swim);
  const s2 = smoothstep(2 / 3 - halfZone, 2 / 3 + halfZone, swim);
  const mix = (key: 'light' | 'amp' | 'freq') => lerp(lerp(REGIONS[0][key], REGIONS[1][key], s1), REGIONS[2][key], s2);

  // Regions and the blend zones on their borders.
  g.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const x = left + (width * i) / 3;
    g.globalAlpha = 0.4;
    g.strokeRect(x, trackTop, width / 3, trackH);
    label(g, font, fs, REGIONS[i].name, x + width / 6, trackTop + trackH + fs * 1.1, 0.55, 'center');
  }
  g.setLineDash([3, 4]);
  for (const border of [1 / 3, 2 / 3]) {
    for (const edge of [-halfZone, halfZone]) {
      const x = left + width * (border + edge);
      g.globalAlpha = 0.3;
      g.beginPath();
      g.moveTo(x, trackTop);
      g.lineTo(x, trackTop + trackH);
      g.stroke();
    }
  }
  g.setLineDash([]);

  // The diver, with a plumb line down to the readouts.
  const dx = left + width * swim;
  const dy = trackTop + trackH / 2;
  g.globalAlpha = 0.25;
  g.beginPath();
  g.moveTo(dx, dy);
  g.lineTo(dx, h * 0.9);
  g.stroke();
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(dx, dy, w * 0.016, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 0.5;
  g.beginPath();
  g.arc(dx, dy, w * 0.03 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2);
  g.stroke();

  // State readout.
  let state = `in ${REGIONS[swim < 0.5 ? (s1 < 1 ? 0 : 1) : s2 < 1 ? 1 : 2].name}`;
  if (s1 > 0.02 && s1 < 0.98) state = `${REGIONS[0].name} → ${REGIONS[1].name}  ${Math.round(s1 * 100)}%`;
  else if (s2 > 0.02 && s2 < 0.98) state = `${REGIONS[1].name} → ${REGIONS[2].name}  ${Math.round(s2 * 100)}%`;
  label(g, font, fs, `state: ${state}`, left, h * 0.57, 0.8);

  // Light: a bar filled to the blended brightness.
  const barY = h * 0.67;
  label(g, font, fs, 'light', left, barY, 0.55);
  const barX = left + fs * 5;
  const barW = w - pad - barX;
  g.globalAlpha = 0.4;
  g.strokeRect(barX, barY - fs * 0.5, barW, fs);
  g.globalAlpha = 0.85;
  g.fillRect(barX, barY - fs * 0.5, barW * mix('light'), fs);

  // Sound: a wave whose size and pitch follow the blend.
  const waveY = h * 0.84;
  label(g, font, fs, 'sound', left, waveY, 0.55);
  const amp = mix('amp') * h * 0.07;
  const freq = mix('freq');
  g.globalAlpha = 0.85;
  g.beginPath();
  for (let x = 0; x <= barW; x += 2) {
    const y = waveY + Math.sin((x / barW) * freq * Math.PI * 2 - t * 4) * amp;
    if (x === 0) g.moveTo(barX + x, y);
    else g.lineTo(barX + x, y);
  }
  g.stroke();
}

const SAVED = [
  { key: 'name', value: '"Diver"' },
  { key: 'oxygen', value: '80' },
  { key: 'nomis', value: '9000' },
  { key: 'oldFlag', value: 'true' },
];
const CURRENT = [
  { key: 'name', value: '"Diver"' },
  { key: 'oxygen', value: '80' },
  { key: 'nomis', value: '9000' },
  { key: 'flashlight', value: 'false' },
];

/** An older save is read into a newer schema: matching fields carry over, a new one gets a default, a removed one is dropped. */
function serializer({ g, w, h, t, font }: StageArgs) {
  const fs = Math.max(10, w / 34);
  const pad = w * 0.07;
  const cardW = w * 0.34;
  const cardTop = h * 0.2;
  const rowH = h * 0.14;
  const cardH = rowH * 4 + rowH * 0.5;
  const rightX = w - pad - cardW;

  const cycle = 10;
  const c = t % cycle;
  const fadeOut = 1 - smoothstep(9, 9.8, c);

  label(g, font, fs, 'saved data', pad, h * 0.09, 0.55);
  label(g, font, fs, 'current schema', rightX, h * 0.09, 0.55);
  label(g, font, fs, 'deserialize', w / 2, cardTop - h * 0.1, 0.55, 'center');

  g.lineWidth = 1;
  for (const x of [pad, rightX]) {
    g.globalAlpha = 0.4;
    g.strokeRect(x, cardTop, cardW, cardH);
  }

  const rowY = (i: number) => cardTop + rowH * (i + 0.75);
  const textLeft = (x: number) => x + fs * 0.8;
  const textRight = (x: number) => x + cardW - fs * 0.8;

  for (let i = 0; i < 4; i++) {
    const y = rowY(i);
    // Rows are handled one after the other.
    const start = 0.8 + i * 1.5;
    const k = smoothstep(start, start + 1.1, c);

    label(g, font, fs, SAVED[i].key, textLeft(pad), y, 0.85 * fadeOut + 0.15 * (1 - fadeOut));
    label(g, font, fs, SAVED[i].value, textRight(pad), y, 0.5, 'right');

    const fromX = pad + cardW + fs * 0.3;
    const toX = rightX - fs * 0.3;
    if (i < 3) {
      // Carried over: a line draws across and the value lands in the new schema.
      g.globalAlpha = 0.35 * fadeOut;
      g.beginPath();
      g.moveTo(fromX, y);
      g.lineTo(fromX + (toX - fromX) * k, y);
      g.stroke();
      g.globalAlpha = 0.9 * fadeOut;
      g.fillRect(fromX + (toX - fromX) * k - 2, y - 2, 4, 4);
      label(g, font, fs, CURRENT[i].key, textLeft(rightX), y, 0.85 * fadeOut * Math.max(k, 0.25));
      label(g, font, fs, CURRENT[i].value, textRight(rightX), y, 0.5 * fadeOut * k, 'right');
    } else {
      // Removed field: the line stops halfway and is crossed out.
      const stop = fromX + (toX - fromX) * 0.4;
      g.globalAlpha = 0.35 * fadeOut;
      g.setLineDash([3, 4]);
      g.beginPath();
      g.moveTo(fromX, y);
      g.lineTo(fromX + (stop - fromX) * k, y);
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 0.9 * k * fadeOut;
      g.beginPath();
      g.moveTo(stop + 3, y - 5);
      g.lineTo(stop + 13, y + 5);
      g.moveTo(stop + 13, y - 5);
      g.lineTo(stop + 3, y + 5);
      g.stroke();
      label(g, font, fs, 'dropped', (fromX + stop) / 2, y + fs * 1.2, 0.5 * k * fadeOut, 'center');
    }
  }

  // The new field has no saved value, so it gets its default.
  const kd = smoothstep(5.6, 6.6, c);
  const y = rowY(3);
  label(g, font, fs, CURRENT[3].key, textLeft(rightX), y, 0.85 * fadeOut);
  label(g, font, fs, CURRENT[3].value, textRight(rightX), y, 0.9 * kd * fadeOut, 'right');
  label(g, font, fs, 'default', rightX + cardW / 2, y + fs * 1.5, 0.5 * kd * fadeOut, 'center');
  label(g, font, fs, 'no migration written', w / 2, h * 0.93, 0.5 * smoothstep(7, 8, c) * fadeOut, 'center');
}

export const stages: Record<AquaKind, (args: StageArgs) => void> = { regions, serializer };

/** The moment shown when animation is off (reduced motion): the one where the idea is most readable. */
export const stillTime: Record<AquaKind, number> = { regions: 3.4, serializer: 8 };
