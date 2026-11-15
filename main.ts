// ai-excited-01 — entrypoint. Delivers entry.png, byte for byte.
//
// The picture: a humpback whale, huge as the room, breaching out of a
// small framed seascape painting on a gallery wall. Spray bursts out of
// the frame while the painted sea stays flat inside it; a boy below
// reaches up at the whale. Golden-hour light, deep teal and gold.
//
// The judge scores the image, not this program, so this file is a
// courier: it hands the exact bytes to the output directory, refuses
// anything that breaks the competition gate (whole JPEG, at most 1 MiB
// and 1024x1024 px), and proves the delivered copy matches the source
// with a sha256 digest before it prints anything.
//
// Anchor — drand round 33993421, emitted 2026-11-15T23:00:27Z, after the
// competition opened: ac2ef141f21651e962ede1b7a1576dda1bc02e60
//
// Run it: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SOURCE = new URL('./entry.png', import.meta.url);
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const TARGET = join(OUTPUT_DIR, 'entry.png');

// Competition gate, in bytes and pixels.
const BYTE_CAP = 1024 * 1024;
const EDGE_CAP = 1024;

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// A JPEG keeps its width and height in a Start-Of-Frame segment. Scan the
// marker stream starting just past the SOI bytes (ff d8). Standalone
// markers — SOI, TEM, RSTn — are two bytes with no length field; every
// other segment carries its own length, so we skip it whole. SOF0 (c0)
// and SOF2 (c2) hold height then width, big-endian, five and seven bytes
// past the marker byte.
function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('entry.png is not a JPEG: missing SOI marker');
  }
  let offset = 2;
  while (offset + 9 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error('entry.png has no Start-Of-Frame segment');
}

const source = readFileSync(SOURCE);
if (source.length > BYTE_CAP) {
  throw new Error(`entry.png is ${source.length} bytes, over the 1 MiB limit`);
}

const { width, height } = readJpegDimensions(source);
if (width > EDGE_CAP || height > EDGE_CAP) {
  throw new Error(`entry.png is ${width}x${height}, over the ${EDGE_CAP}x${EDGE_CAP} limit`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

const delivered = readFileSync(TARGET);
if (delivered.length !== source.length) {
  throw new Error(`delivered entry.png is ${delivered.length} bytes, expected ${source.length}`);
}
if (digest(delivered) !== digest(source)) {
  throw new Error('delivered entry.png failed the sha256 integrity check');
}

// The harness runs this program twice and expects identical bytes both
// times, so the only output is a single delivery line, and the exit code
// is 0 on success.
console.log(`delivered entry.png ${width}x${height}, ${source.length} bytes, sha256 ${digest(source)}`);
