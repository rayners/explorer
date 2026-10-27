import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
export const iconPixels = [
  '................',
  '................',
  '..aaaaaaaaaaaa..',
  '..a.........a...',
  '..a........a....',
  '..a.......a.....',
  '..a......a......',
  '..aaaaaaa.......',
  '..a....a........',
  '..a...a.........',
  '..a..a.....a....',
  '..a.a.....aa....',
  '..aa.....a.a....',
  '..a.....aaaa....',
  '................',
  '................',
];
const crc = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const tag = Buffer.from(type),
    length = Buffer.alloc(4),
    sum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, sum]);
};
export function png(size: number, pixels = iconPixels, ink = [218, 167, 124, 255]) {
  const data = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      const col =
        pixels[Math.floor((y / size) * 16)][Math.floor((x / size) * 16)] === 'a'
          ? ink
          : [16, 27, 30, 255];
      for (let k = 0; k < 4; k++) data[row + 1 + x * 4 + k] = col[k];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(data)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
if (process.argv[1]?.endsWith('make-icons.ts')) {
  for (const size of [180, 192, 512])
    writeFileSync(`public/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`, png(size));
  mkdirSync('public/hollowmere', { recursive: true });
  const castle = [
    '................',
    '.......a........',
    '......aaa.......',
    '......aaa.......',
    '..a...aaa...a...',
    '..aa.aaaaa.aa...',
    '..aaaaaaaaaaa...',
    '..aaaaaaaaaaa...',
    '..aa..aaa..aa...',
    '..aaaaaaaaaaa...',
    '..aaaaa.aaaaa...',
    '..aaaa...aaaa...',
    '..aaaa...aaaa...',
    '..aaaa...aaaa...',
    '................',
    '................',
  ];
  for (const size of [180, 192, 512])
    writeFileSync(
      `public/hollowmere/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`,
      png(size, castle, [190, 163, 103, 255]),
    );
  writeFileSync(
    'public/hollowmere/icon.svg',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a1c19"/><path d="M12 52V24h8v8h8V12h8v20h8v-8h8v28H36V40h-8v12z" fill="#bea367"/></svg>',
  );
  writeFileSync(
    'public/icon.svg',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#101b1e"/><path d="M12 12h40L16 52V12m0 20h20m0 20 16-16v16z" fill="none" stroke="#daa77c" stroke-width="3"/></svg>',
  );
}
