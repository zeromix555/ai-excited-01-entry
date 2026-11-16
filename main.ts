// ai-excited-01 — entrypoint. Hands entry.png to the grader, byte for byte.
//
// The picture: a humpback whale, bigger than the room, smashing out of
// a small framed seascape painting on a gallery wall. The painted sea
// inside the gilt frame stays flat; outside it, seawater and frame
// splinters explode into spray, and a small boy below reaches up at
// the whale. Golden-hour light, deep teal against warm gold.
//
// This program is only a courier. The judge scores the image, not the
// code, so the file does three small things: enforce the competition
// gate (whole JPEG, at most 1 MiB and 1024x1024 px), copy the file to
// $MAKEFUN_OUTPUT_DIR/entry.png, and prove the copy is identical with
// a sha256 digest before printing anything. Nothing here is random,
// nothing reads the clock, nothing depends on the machine — the same
// input always produces the same delivered bytes.
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
const LIMIT_BYTES = 1024 * 1024;
const LIMIT_SIDE = 1024;

function hashBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// A JPEG stores width and height in a Start-Of-Frame segment. Walk the
// marker stream from just past the SOI bytes (ff d8). Standalone
// markers — SOI, TEM, RSTn — are two bytes with no length field; every
// other segment carries its own length, so skip it whole. SOF0 (c0)
// and SOF2 (c2) hold height then width, big-endian, five and seven
// bytes past the marker byte.
function jpegSize(bytes: Buffer): { width: number; height: number } {
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
if (source.length > LIMIT_BYTES) {
  throw new Error(`entry.png is ${source.length} bytes, over the 1 MiB limit`);
}

const { width, height } = jpegSize(source);
if (width > LIMIT_SIDE || height > LIMIT_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the ${LIMIT_SIDE}x${LIMIT_SIDE} limit`);
}

// A whole JPEG ends with the End-Of-Image marker (ff d9). A file cut
// short — a truncated download, a half-written render — would still
// pass the SOF walk above, so refuse it here instead of delivering a
// picture the judge can only half read.
if (source.length < 2 || source[source.length - 2] !== 0xff || source[source.length - 1] !== 0xd9) {
  throw new Error('entry.png is truncated: missing End-Of-Image marker');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

const delivered = readFileSync(TARGET);
if (delivered.length !== source.length) {
  throw new Error(`delivered entry.png is ${delivered.length} bytes, expected ${source.length}`);
}
if (hashBytes(delivered) !== hashBytes(source)) {
  throw new Error('delivered entry.png failed the sha256 integrity check');
}

// The harness runs this program twice and expects identical bytes both
// times, so the only output is one delivery line, and the exit code is
// 0 on success. The line names the delivered size and digest so a
// human re-running the entry can compare it against the source at a
// glance, without opening the image.
console.log(`delivered entry.png ${width}x${height}, ${source.length} bytes, sha256 ${hashBytes(source)}`);
