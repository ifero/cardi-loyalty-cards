#!/usr/bin/env node
/**
 * Flatten store screenshots to 8-bit RGB PNGs with no alpha channel (Story 24.6).
 *
 *   node scripts/flatten-store-screenshots.mjs <file.png> [...more]
 *
 * Simulator and emulator captures (`xcrun simctl io … screenshot`, `adb exec-out screencap -p`)
 * are RGBA, even when every pixel is opaque, and both consoles want no alpha channel. This
 * rewrites each file in place as colour type 2 over black, so the pixels a viewer sees do not
 * change: a capture is opaque everywhere, and the round Wear OS corners are already black.
 *
 * It decodes any 8-bit RGB or RGBA PNG (all five scanline filters), which is all the capture tools
 * write; anything else (palette, 16-bit, interlaced) is refused rather than guessed at.
 * `test/store-screenshots.test.ts` checks the result.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
};

const decode = (png, file) => {
  if (!png.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${file}: not a PNG`);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const depth = png.readUInt8(24);
  const colorType = png.readUInt8(25);
  const interlace = png.readUInt8(28);
  if (depth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
    throw new Error(`${file}: expected 8-bit, non-interlaced RGB or RGBA`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const parts = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
      parts.push(png.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter];
      if (predictor === undefined) throw new Error(`${file}: bad filter ${filter} on row ${y}`);
      pixels[y * stride + x] = (line[x] + predictor) & 0xff;
    }
  }
  return { width, height, channels, pixels };
};

const encodeRgb = ({ width, height, channels, pixels }) => {
  const rows = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = (y * width + x) * channels;
      const alpha = channels === 4 ? pixels[from + 3] / 255 : 1;
      const to = y * (width * 3 + 1) + 1 + x * 3;
      for (let i = 0; i < 3; i += 1) rows[to + i] = Math.round(pixels[from + i] * alpha);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/flatten-store-screenshots.mjs <file.png> [...more]');
  process.exit(1);
}
for (const file of files) {
  const image = decode(readFileSync(file), file);
  writeFileSync(file, encodeRgb(image));
  console.log(`${file}: ${image.width} x ${image.height}, RGB`);
}
