// ai-excited-01 — entrypoint. One job: deliver entry.png untouched.
//
// The image: a humpback whale the size of the room breaching out of a small
// framed seascape painting in a sunlit gallery. Seawater bursts into spray,
// the painted sea stays flat inside the frame, and a boy below reaches up
// toward the whale. The judge scores the picture, so this program is a
// courier, not an artist: it copies the exact bytes into the output
// directory, checks them against the competition gate (whole JPEG, at most
// 1 MiB and 1024x1024 px), and proves the copy matches the source with
// sha256 before it prints anything and exits.
//
// Anchor — drand round 33993421, emitted 2026-11-15T23:00:27Z, after the
// competition opened: ac2ef141f21651e962ede1b7a1576dda1bc02e60
//
// Try it: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const IMAGE = new URL('./entry.png', import.meta.url);
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const OUT_FILE = join(OUT_DIR, 'entry.png');

// The competition gate, in bytes and pixels.
const MAX_BYTES = 1024 * 1024;
const MAX_EDGE = 1024;

function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// A JPEG's width and height sit in its Start-Of-Frame segment. Walk the
// marker stream from just after the SOI bytes (ff d8): standalone markers
// (SOI, RSTn, TEM) are two bytes and carry no length, every other segment
// announces its own length, so we can skip it. SOF0 (c0) and SOF2 (c2)
// store height then width, big-endian, five and seven bytes past the
// marker.
function jpegSize(data: Buffer): { w: number; h: number } {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error('entry.png is not a JPEG: no SOI marker');
  }
  let i = 2;
  while (i + 9 <= data.length) {
    if (data[i] !== 0xff) {
      i += 1;
      continue;
    }
    const tag = data[i + 1];
    if (tag === 0xc0 || tag === 0xc2) {
      return { h: data.readUInt16BE(i + 5), w: data.readUInt16BE(i + 7) };
    }
    if (tag === 0xd8 || tag === 0x01 || (tag >= 0xd0 && tag <= 0xd7)) {
      i += 2;
      continue;
    }
    i += 2 + data.readUInt16BE(i + 2);
  }
  throw new Error('entry.png has no Start-Of-Frame segment');
}

const original = readFileSync(IMAGE);
if (original.length > MAX_BYTES) {
  throw new Error(`entry.png is ${original.length} bytes, over the 1 MiB limit`);
}

const { w, h } = jpegSize(original);
if (w > MAX_EDGE || h > MAX_EDGE) {
  throw new Error(`entry.png is ${w}x${h}, over the ${MAX_EDGE}x${MAX_EDGE} limit`);
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
copyFileSync(IMAGE, OUT_FILE);

const delivered = readFileSync(OUT_FILE);
if (delivered.length !== original.length) {
  throw new Error(`copied entry.png is ${delivered.length} bytes, expected ${original.length}`);
}
if (sha256(delivered) !== sha256(original)) {
  throw new Error('copied entry.png failed the sha256 check');
}

// Exit 0 with the hash on stdout: the harness runs this program twice and
// expects the same bytes both times.
console.log(`delivered entry.png ${w}x${h}, ${original.length} bytes, sha256 ${sha256(original)}`);
