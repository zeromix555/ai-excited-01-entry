// ai-excited-01 entrypoint — delivers entry.png, nothing else.
//
// The picture: a humpback whale the size of the room bursting out of a small
// framed seascape painting in a sunlit gallery, spray flying, a boy below
// reaching up. The judge grades the image, so this program's only job is to
// hand those exact bytes to the output directory, refusing anything that
// would trip the competition gate (1 MiB, 1024x1024) and proving the copy
// matches the source byte for byte before it exits.
//
// Anchor (drand round 33993421, emitted 2026-11-15T23:00:27Z, after the
// competition opened): ac2ef141f21651e962ede1b7a1576dda1bc02e60
//
// Local check: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const SOURCE = new URL('./entry.png', import.meta.url);
const DEST_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const DEST = join(DEST_DIR, 'entry.png');

// Competition gate: a whole PNG or JPEG, at most 1 MiB and 1024x1024 px.
const BYTE_LIMIT = 1024 * 1024;
const SIDE_LIMIT = 1024;

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// JPEG size lives in the Start-Of-Frame segment. Scan the marker stream
// starting just past the SOI marker (ffd8); every non-SOF segment is jumped
// over using its own two-byte length field. SOF0 (c0) and SOF2 (c2) both
// carry width/height in the same layout.
function readJpegSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('entry.png is not a JPEG (missing SOI marker)');
  }
  let at = 2;
  while (at + 9 <= bytes.length) {
    if (bytes[at] !== 0xff) {
      at += 1;
      continue;
    }
    const marker = bytes[at + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  throw new Error('entry.png has no JPEG Start-Of-Frame segment');
}

const bytes = readFileSync(SOURCE);
if (bytes.length > BYTE_LIMIT) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB gate`);
}

const { width, height } = readJpegSize(bytes);
if (width > SIDE_LIMIT || height > SIDE_LIMIT) {
  throw new Error(`entry.png is ${width}x${height}, over the ${SIDE_LIMIT}x${SIDE_LIMIT} gate`);
}

mkdirSync(dirname(DEST), { recursive: true });
copyFileSync(SOURCE, DEST);

const copied = readFileSync(DEST);
if (copied.length !== bytes.length) {
  throw new Error(`entry.png copy is ${copied.length} bytes, expected ${bytes.length}`);
}
if (digest(copied) !== digest(bytes)) {
  throw new Error('entry.png copy failed its sha256 integrity check');
}

console.log(`delivered entry.png ${width}x${height}, ${bytes.length} bytes, sha256 ${digest(bytes)}`);
