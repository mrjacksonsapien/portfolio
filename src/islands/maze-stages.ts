// Drawing code for the small animations on the Maze game page, one function per kind (see Stage.svelte).
// Each is a pure function of time `t` (seconds), drawn in the foreground color at varying opacity.
import { smoothstep, lerp, label, type StageArgs } from './stage-kit';

export type MazeKind = 'shift-register' | 'matrix-scan' | 'captive-portal';

/** One 8x8 picture as the game stores it: a row per string, `#` is a lit LED. This is room 6 of the maze with the player in it. */
export const ROOM = [
  '########',
  '#......#',
  '#.......',
  '#...#...',
  '#.......',
  '#.......',
  '#......#',
  '##....##',
];

/** The pictures the real game shows after the maze, one byte per row (see game_engine.c). */
export const WIFI_FRAMES = [
  ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00010000', '00000000'],
  ['00000000', '00000000', '00000000', '00000000', '00111000', '01000100', '00010000', '00000000'],
  ['00000000', '00111000', '01000100', '10000010', '00111000', '01000100', '00010000', '00000000'],
];
export const CHECK = ['00000000', '00000000', '00000100', '00001000', '01010000', '00100000', '00000000', '00000000'];

const bits = (n: number, prefix = '0b') => prefix + n.toString(2).padStart(8, '0');

/** The byte that lights column `col` of `picture` (rows 0..7 in bit 7..0) and the byte that selects the column (active low). */
function columnBytes(picture: string[], col: number) {
  let rows = 0;
  for (let r = 0; r < 8; r++) if (picture[r][col] === '#' || picture[r][col] === '1') rows |= 1 << (7 - r);
  return { rows, cols: ~(1 << col) & 0xff };
}

// ---------------------------------------------------------------------------------------------------------------

const SENT = 0b01100110; // the byte the shift register receives in the demo

/** A byte goes in one bit at a time (data + clock), then a latch pulse makes all 8 outputs change together. */
function shiftRegister({ g, w, h, t, font }: StageArgs) {
  const fs = Math.max(10, w / 34);
  const pad = w * 0.07;
  const period = 0.8;
  const cycle = 12;
  const c = t % cycle;
  const fade = 1 - smoothstep(11, 11.8, c);
  const clocks = Math.min(8, Math.floor(c / period)); // clock pulses completed so far
  const latched = c >= 8 * period + 0.2 && c < 11.8;

  // Timeline: DATA, CLOCK and LATCH over 9 periods (8 bits, then the latch). A cursor follows the time.
  const left = pad + fs * 4.2;
  const right = w - pad;
  const slot = (right - left) / 9;
  const rows = [h * 0.13, h * 0.27, h * 0.41];
  const amp = h * 0.035;
  const names = ['DATA', 'CLOCK', 'LATCH'];
  const cursor = Math.min(c / period, 9);

  for (let s = 0; s < 3; s++) {
    const y = rows[s];
    label(g, font, fs, names[s], pad, y, 0.6 * fade);
    // The signal as a polyline of (time, level) steps, drawn faint, then bright up to the cursor.
    const pts: [number, number][] = [];
    const level = (k: number, half: number) => {
      if (s === 0) return k < 8 ? (SENT >> (7 - k)) & 1 : 0;
      if (s === 1) return k < 8 && half === 1 ? 1 : 0;
      return k === 8 && half === 1 ? 1 : 0;
    };
    for (let k = 0; k < 9; k++) {
      for (let half = 0; half < 2; half++) {
        const lv = s === 0 ? level(k, 0) : level(k, half);
        const x0 = k + half * 0.5;
        pts.push([x0, lv], [x0 + 0.5, lv]);
      }
    }
    for (const pass of [0, 1]) {
      g.globalAlpha = (pass === 0 ? 0.25 : 0.9) * fade;
      g.beginPath();
      let started = false;
      for (const [x, lv] of pts) {
        const clipped = pass === 1 && x > cursor;
        const px = left + (clipped ? cursor : x) * slot;
        const py = y - lv * amp;
        if (!started) {
          g.moveTo(px, py);
          started = true;
        } else g.lineTo(px, py);
        if (clipped) break;
      }
      g.stroke();
    }
    if (s === 0) {
      for (let k = 0; k < 8; k++) label(g, font, fs * 0.85, String((SENT >> (7 - k)) & 1), left + (k + 0.5) * slot, y + amp * 1.9, 0.5 * fade, 'center');
    }
  }
  g.globalAlpha = 0.3 * fade;
  g.beginPath();
  g.moveTo(left + cursor * slot, rows[0] - amp * 1.4);
  g.lineTo(left + cursor * slot, rows[2] + amp * 0.6);
  g.stroke();

  // Which bit is in flight, as the code writes it.
  if (clocks < 8) {
    const i = 7 - Math.floor(c / period);
    label(g, font, fs, `(pattern >> ${i}) & 1`, w / 2, h * 0.53, 0.7 * fade, 'center');
  } else {
    label(g, font, fs, c < 8 * period + 0.2 ? '8 bits in' : 'latch: all outputs at once', w / 2, h * 0.53, 0.7 * fade, 'center');
  }

  // The register: every clock pulse moves each bit one cell along and a new bit enters at the left.
  const cellW = (w - pad * 2) / 8;
  const regTop = h * 0.6;
  const cellH = h * 0.11;
  label(g, font, fs, '74HC595', pad, regTop - fs * 1.1, 0.55 * fade);
  for (let j = 0; j < 8; j++) {
    const x = pad + j * cellW;
    g.globalAlpha = 0.45 * fade;
    g.strokeRect(x + 1, regTop, cellW - 2, cellH);
    const from = clocks - 1 - j; // index of the bit that sits in this cell
    if (from >= 0) {
      const bit = (SENT >> (7 - from)) & 1;
      label(g, font, fs * 1.1, String(bit), x + cellW / 2, regTop + cellH / 2, 0.9 * fade, 'center');
    }
  }

  // Outputs: they only follow the register when the latch fires.
  const outY = h * 0.88;
  const r = Math.min(cellW * 0.26, h * 0.04);
  for (let j = 0; j < 8; j++) {
    const x = pad + (j + 0.5) * cellW;
    const lit = latched && ((SENT >> j) & 1) === 1; // the first bit sent ends up in the last cell
    g.globalAlpha = (latched ? 0.5 : 0.2) * fade;
    g.beginPath();
    g.moveTo(x, regTop + cellH);
    g.lineTo(x, outY - r);
    g.stroke();
    g.globalAlpha = (lit ? 0.95 : 0.4) * fade;
    g.beginPath();
    g.arc(x, outY, r, 0, Math.PI * 2);
    if (lit) g.fill();
    else g.stroke();
    label(g, font, fs * 0.8, `Q${j}`, x, outY + r + fs * 1.1, 0.4 * fade, 'center');
  }
}

// ---------------------------------------------------------------------------------------------------------------

/** Real speed is about 125 refreshes a second; the animation slows that down, then lets it run at full speed. */
function matrixScan({ g, w, h, t, font }: StageArgs) {
  const fs = Math.max(10, w / 34);
  const pad = w * 0.07;
  const size = Math.min(w * 0.56, h * 0.78);
  const x0 = pad;
  const y0 = (h - size) / 2 - fs * 0.6;
  const pitch = size / 8;

  const c = t % 16;
  // 0 = slow motion, 1 = real speed (the eye can no longer follow the scan).
  const fast = smoothstep(6, 8, c) * (1 - smoothstep(13, 15, c));
  const colsPerSecond = 2.2;
  const pos = (c * colsPerSecond) % 8; // slow-motion scan position, in columns
  const current = fast > 0.5 ? Math.floor((t * 125) % 8) : Math.floor(pos);

  g.lineWidth = 1;
  g.globalAlpha = 0.35;
  g.strokeRect(x0 - pitch * 0.2, y0 - pitch * 0.2, size + pitch * 0.4, size + pitch * 0.4);

  for (let col = 0; col < 8; col++) {
    // In slow motion a column glows while it is selected and fades like afterglow; at full speed it all blends into one picture.
    const since = (((pos - col) % 8) + 8) % 8;
    const slow = Math.exp(-since / 1.6);
    const seen = lerp(slow, 1, fast);
    const selected = col === current;
    const cx = x0 + (col + 0.5) * pitch;
    for (let r = 0; r < 8; r++) {
      const cy = y0 + (r + 0.5) * pitch;
      const on = ROOM[r][col] === '#';
      const rad = pitch * 0.32;
      g.globalAlpha = on ? 0.15 + 0.8 * seen : 0.12;
      g.beginPath();
      g.arc(cx, cy, rad, 0, Math.PI * 2);
      if (on) g.fill();
      else g.stroke();
      if (on && selected && fast < 0.6) {
        g.globalAlpha = 0.5 * (1 - fast);
        g.beginPath();
        g.arc(cx, cy, rad * 1.5, 0, Math.PI * 2);
        g.stroke();
      }
    }
  }
  // The selected column.
  g.globalAlpha = 0.5;
  g.strokeRect(x0 + current * pitch + 1, y0 - pitch * 0.1, pitch - 2, size + pitch * 0.2);

  // The two bytes sent for that column, as the code builds them.
  const { rows, cols } = columnBytes(ROOM, current);
  const tx = x0 + size + pitch * 0.9;
  const lineH = fs * 1.9;
  const ty = y0 + size * 0.2;
  label(g, font, fs, `column ${current}`, tx, ty, 0.85);
  label(g, font, fs * 0.85, 'rows (LEDs on)', tx, ty + lineH, 0.45);
  label(g, font, fs, bits(rows), tx, ty + lineH * 1.8, 0.85);
  label(g, font, fs * 0.85, 'column select', tx, ty + lineH * 2.8, 0.45);
  label(g, font, fs, bits(cols), tx, ty + lineH * 3.6, 0.85);
  label(g, font, fs * 0.85, '1 ms per column', tx, ty + lineH * 4.8, 0.45);

  label(g, font, fs, fast > 0.5 ? 'real speed' : 'slow motion', w / 2, h * 0.95, 0.7, 'center');
}

// ---------------------------------------------------------------------------------------------------------------

interface Message {
  at: number;
  from: 'phone' | 'esp';
  text: string;
}

const MESSAGES: Message[] = [
  { at: 2.2, from: 'phone', text: 'join "Bunker\'s code"' },
  { at: 4.2, from: 'esp', text: 'connected (1 of 1)' },
  { at: 6.2, from: 'phone', text: 'DNS: where is any.site?' },
  { at: 7.8, from: 'esp', text: '192.168.4.1 (always me)' },
  { at: 9.4, from: 'phone', text: 'GET /' },
  { at: 10.8, from: 'esp', text: 'HTML with the code' },
];

/** The escape room's network: hidden and closed until the maze is solved, then one phone joins and is redirected to the page. */
function captivePortal({ g, w, h, t, font }: StageArgs) {
  const fs = Math.max(10, w / 34);
  const c = t % 16;
  const fade = 1 - smoothstep(14.6, 15.6, c);
  const phoneX = w * 0.17;
  const espX = w * 0.83;
  const topY = h * 0.19;
  const botY = h * 0.92;
  const solved = c >= 1;

  // The two ends and their lifelines.
  for (const [x, name] of [[phoneX, 'phone'], [espX, 'ESP32']] as const) {
    label(g, font, fs, name, x, h * 0.07, 0.8 * fade, 'center');
    g.globalAlpha = 0.25 * fade;
    g.setLineDash([3, 4]);
    g.beginPath();
    g.moveTo(x, topY - fs * 0.6);
    g.lineTo(x, botY);
    g.stroke();
    g.setLineDash([]);
  }

  // The access point's state, on the ESP side.
  label(g, font, fs * 0.85, solved ? 'AP visible' : 'AP hidden', espX, h * 0.13, 0.5 * fade, 'center');
  if (solved) {
    const arcs = c < 2.2 ? Math.floor(((c - 1) / 0.4) % 4) : 3; // the wifi symbol blinks until someone joins
    g.globalAlpha = 0.9 * fade;
    for (let i = 0; i < 3; i++) {
      if (i < arcs) {
        g.globalAlpha = 0.75 * fade;
        g.beginPath();
        g.arc(espX - fs * 4.6, h * 0.135 + fs * 0.7, fs * (0.55 + i * 0.55), -Math.PI * 0.75, -Math.PI * 0.25);
        g.stroke();
      }
    }
  }

  // Messages: an arrow draws across, a packet rides it, the label stays.
  const step = (botY - topY) / (MESSAGES.length + 0.3);
  MESSAGES.forEach((m, i) => {
    const y = topY + step * (i + 0.8);
    const k = smoothstep(m.at, m.at + 0.9, c);
    if (k <= 0) return;
    const dir = m.from === 'phone' ? 1 : -1;
    const a = m.from === 'phone' ? phoneX : espX;
    const b = m.from === 'phone' ? espX : phoneX;
    const x = lerp(a, b, k);
    g.globalAlpha = 0.5 * fade;
    g.beginPath();
    g.moveTo(a, y);
    g.lineTo(x, y);
    g.stroke();
    if (k >= 1) {
      g.beginPath();
      g.moveTo(b - dir * fs * 0.7, y - fs * 0.35);
      g.lineTo(b, y);
      g.lineTo(b - dir * fs * 0.7, y + fs * 0.35);
      g.stroke();
    } else {
      g.globalAlpha = 0.95 * fade;
      g.fillRect(x - 2, y - 2, 4, 4);
    }
    label(g, font, fs * 0.9, m.text, (phoneX + espX) / 2, y - fs * 0.9, (0.4 + 0.5 * k) * fade, 'center');
  });

  // The phone's operating system opens the page as a popup on its own.
  const popup = smoothstep(11.6, 12.6, c);
  if (popup > 0) {
    const pw = w * 0.42;
    const ph = h * 0.15;
    const px = w / 2 - pw / 2;
    const py = botY - ph * 0.55 + (1 - popup) * 6;
    g.globalAlpha = 0.9 * popup * fade;
    g.fillStyle = '#000';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = g.strokeStyle;
    g.strokeRect(px, py, pw, ph);
    label(g, font, fs * 0.85, 'Captive Wi-Fi', px + fs * 0.7, py + fs * 1.1, 0.5 * popup * fade);
    label(g, font, fs, 'Bunker\'s code', px + fs * 0.7, py + fs * 2.6, 0.95 * popup * fade);
  }
}

export const stages: Record<MazeKind, (args: StageArgs) => void> = {
  'shift-register': shiftRegister,
  'matrix-scan': matrixScan,
  'captive-portal': captivePortal,
};

/** The moment shown when animation is off (reduced motion): the one where the idea is most readable. */
export const stillTime: Record<MazeKind, number> = { 'shift-register': 9.5, 'matrix-scan': 2.2, 'captive-portal': 13.5 };
