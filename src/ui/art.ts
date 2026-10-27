import { generator } from '../engine/random';
import type { LocationDef } from '../engine/types';
/** Code-native pixel artwork, drawn at a fixed logical resolution. */
export function drawScene(canvas: HTMLCanvasElement, loc: LocationDef, travel = false) {
  canvas.width = 640;
  canvas.height = 260;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const rng = generator(1701 + loc.id.split('').reduce((n, s) => n + s.charCodeAt(0), 0));
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  };
  rect(0, 0, 640, 260, '#0a151b');
  for (let y = 0; y < 260; y += 4)
    rect(0, y, 640, 4, y > 160 ? '#16272b' : y > 90 ? '#102127' : '#0b181e');
  for (let i = 0; i < 175; i++) {
    const x = Math.floor(rng() * 640),
      y = Math.floor(rng() * 240);
    rect(x, y, rng() > 0.9 ? 2 : 1, 1, ['#72888a', '#40585e', '#bec0a9'][Math.floor(rng() * 3)]);
  }
  // Planet: stepped scan lines with bands and a dark terminator.
  const px = 455,
    py = 132,
    r = 101;
  for (let y = -r; y <= r; y += 2) {
    const width = Math.floor(Math.sqrt(r * r - y * y));
    const band = Math.floor((y + r) / 12) % 5;
    const colors =
      loc.kind === 'Icy moon'
        ? ['#829da5', '#98b4b7', '#678c9a', '#a4c1bd', '#7397a4']
        : ['#b8805b', '#c29168', '#aa7559', '#ce9b70', '#987052'];
    rect(px - width, py + y, width * 2, 2, colors[band]);
    rect(px + Math.floor(width * 0.38), py + y, width * 0.62, 2, '#354447');
    if (width > 40 && Math.abs(y) < 80)
      rect(px - width + 12, py + y, Math.min(width * 0.9, 80), 2, colors[(band + 1) % 5]);
  }
  // Orbital ring, drawn as offset pixels.
  if (loc.station || travel) {
    for (let x = 300; x < 620; x += 3) {
      const y = Math.floor(182 - (x - 300) * 0.25);
      if (x < 362 || x > 535) {
        rect(x, y, 8, 2, '#6d8581');
        rect(x, y + 3, 8, 1, '#344f51');
      }
    }
  }
  if (!loc.station && !travel) {
    for (let x = 0; x < 640; x += 4) {
      const y = 210 + Math.floor(Math.sin(x * 0.02) * 13 + Math.sin(x * 0.07) * 6);
      rect(x, y, 4, 260 - y, '#33474a');
      rect(x, y + 10, 4, 260 - y, '#263b3e');
    }
    for (let x = 0; x < 640; x += 8) {
      const y = 235 + Math.floor(Math.sin(x * 0.036) * 8);
      rect(x, y, 8, 260 - y, '#182c30');
    }
    rect(91, 181, 3, 52, '#7a8982');
    rect(84, 179, 17, 4, '#c8a479');
    rect(96, 183, 30, 1, '#a4aba0');
    rect(123, 183, 2, 12, '#829b95');
    rect(113, 224, 33, 9, '#80918b');
    rect(119, 216, 19, 9, '#b6ba9d');
    rect(125, 218, 8, 3, '#263e42');
  } else {
    // Docking gantry and windows in the foreground.
    rect(0, 0, 51, 260, '#17292e');
    rect(41, 0, 9, 260, '#3b5051');
    rect(51, 28, 140, 9, '#5b6a62');
    rect(51, 37, 123, 5, '#263d40');
    rect(175, 30, 7, 34, '#3a5152');
    for (let y = 12; y < 245; y += 27) {
      rect(8, y, 21, 13, '#31464a');
      rect(11, y + 3, 5, 4, '#c4a276');
      rect(20, y + 3, 5, 4, '#8e9b85');
    }
    rect(0, 244, 640, 16, '#16292d');
    rect(0, 242, 250, 3, '#516763');
    rect(90, 228, 135, 15, '#294145');
    for (let x = 90; x < 220; x += 20) {
      rect(x, 229, 9, 3, '#a18f69');
      rect(x + 4, 236, 12, 6, '#172c30');
    }
  }
  // The Kestrel. Deliberate block shapes, no smoothed vectors.
  const sx = travel ? 190 : 180,
    sy = travel ? 135 : 144;
  rect(sx - 22, sy + 7, 23, 6, '#8bb3b6');
  rect(sx - 32, sy + 9, 13, 2, '#d7ac70');
  rect(sx, sy, 87, 19, '#6f8382');
  rect(sx + 9, sy - 9, 43, 10, '#9aa79a');
  rect(sx + 20, sy - 13, 24, 4, '#d1cab1');
  rect(sx + 71, sy + 3, 29, 12, '#a4afa0');
  rect(sx + 93, sy + 6, 16, 7, '#bfc2a8');
  rect(sx + 82, sy + 4, 10, 4, '#203c44');
  rect(sx + 7, sy + 19, 18, 9, '#3c5558');
  rect(sx + 49, sy + 19, 15, 9, '#3c5558');
  rect(sx + 5, sy + 13, 69, 3, '#4d6263');
  rect(sx + 20, sy - 4, 4, 3, '#d1a16f');
  rect(sx + 30, sy - 4, 4, 3, '#d1a16f');
  rect(sx + 40, sy - 4, 4, 3, '#d1a16f');
  rect(sx + 5, sy + 1, 5, 8, '#d2a16a');
  rect(sx + 14, sy + 1, 2, 8, '#203c44');
  if (!travel) {
    rect(sx + 13, sy + 26, 2, 7, '#7a8d82');
    rect(sx + 54, sy + 26, 2, 7, '#7a8d82');
  }
  for (let y = 0; y < 260; y += 2) rect(0, y, 640, 1, '#07151a0c');
}
export function drawPortrait(canvas: HTMLCanvasElement, index: number) {
  index = index % 3;
  canvas.width = 24;
  canvas.height = 24;
  const c = canvas.getContext('2d')!;
  const p = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  p(0, 0, 24, 24, '#203438');
  p(5, 16, 14, 8, ['#798c7b', '#927e64', '#758a94'][index]);
  p(8, 5, 9, 12, ['#c79b7d', '#b38e6d', '#886954'][index]);
  p(7, 3, 11, 5, ['#3e3c34', '#272d2c', '#292f31'][index]);
  p(7, 6, 2, 6, '#303636');
  p(10, 10, 2, 2, '#263437');
  p(15, 10, 2, 2, '#263437');
  p(12, 15, 3, 1, '#6b5146');
}
