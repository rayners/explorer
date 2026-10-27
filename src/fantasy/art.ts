import { generator } from '../engine/random';
import type { LocationDef } from '../engine/types';
/** Original code-native pixel landscape for the forest, refuges and underground ruins. */
export function drawFantasyScene(canvas: HTMLCanvasElement, location: LocationDef) {
  canvas.width = 640;
  canvas.height = 260;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const random = generator(location.id.length * 3127);
  const p = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  };
  const below = location.region === 'below';
  p(0, 0, 640, 260, below ? '#15151c' : '#182421');
  for (let i = 0; i < 90; i++) p(random() * 640, random() * 190, 1, 1, '#879177');
  if (!below) {
    for (let y = -34; y < 35; y += 2) {
      const width = Math.sqrt(35 * 35 - y * y);
      p(485 - width, 57 + y, width * 2, 2, '#b7b597');
    }
    p(480, 22, 25, 70, '#9fa88c');
  }
  for (let layer = 0; layer < 3; layer++)
    for (let x = -20; x < 670; x += 35 + random() * 20) {
      const height = 95 + random() * 90,
        base = 210 + layer * 12;
      const colors = ['#293b30', '#20322b', '#152921'];
      const width = 6 + layer * 3;
      p(x, base - height, width, height, colors[layer]);
      for (let branch = 0; branch < 5; branch++) {
        const by = base - height + branch * 19;
        p(x - 18 - branch * 3, by, 45 + branch * 7, 3, colors[layer]);
        p(x - 16, by - 8, 3, 12, colors[layer]);
        p(x + 21, by - 10, 3, 12, colors[layer]);
      }
    }
  p(0, 228, 640, 32, '#26322a');
  for (let x = 0; x < 640; x += 5) p(x, 228 + Math.sin(x * 0.08) * 5, 5, 32, '#1a261f');
  if (below || location.station || location.kind.includes('ruins')) {
    const stone = below ? '#55535b' : '#5b6154';
    p(208, 79, 166, 152, stone);
    p(200, 73, 182, 10, '#777565');
    p(218, 62, 26, 17, stone);
    p(259, 62, 26, 17, stone);
    p(302, 62, 26, 17, stone);
    p(343, 62, 26, 17, stone);
    for (let y = 94; y < 220; y += 20)
      for (let x = 211; x < 370; x += 29) {
        p(x, y, 26, 1, '#393e38');
        p(x + 13, y, 1, 19, '#393e38');
      }
    p(267, 160, 44, 72, '#151d1b');
    p(275, 150, 28, 12, '#151d1b');
    p(280, 174, 18, 57, '#2b2a23');
    p(230, 113, 12, 30, '#1e2923');
    p(337, 113, 12, 30, '#1e2923');
    if (location.station) {
      p(278, 182, 16, 48, '#8a653c');
      p(282, 192, 7, 37, '#ba8d4e');
    }
  }
  // Lantern and three tiny silhouettes on the road.
  for (const [i, x] of [114, 138, 161].entries()) {
    p(x, 205, 9, 20, ['#8d8869', '#766a7c', '#a6a089'][i]);
    p(x + 1, 197, 7, 8, '#bca984');
    p(x - 2, 197, 11, 3, ['#625d49', '#54465e', '#8b8871'][i]);
    p(x + 2, 225, 2, 9, '#101c17');
    p(x + 7, 225, 2, 9, '#101c17');
  }
  p(131, 199, 2, 22, '#736c4e');
  p(126, 195, 12, 10, '#ba8b45');
  p(129, 197, 6, 6, '#e3c077');
  for (let i = 0; i < 80; i++) p(random() * 640, 226 + random() * 34, 2, 1, '#5b6547');
}
