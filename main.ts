// ai-excited-01 — the entry is a single image, entry.png, sitting next to this
// file: a giant humpback whale bursting out of a small framed seascape painting
// in a sunlit gallery, spray everywhere, a small boy below reaching up at it.
// The judge is shown exactly the bytes this program hands over, so the program
// does nothing cleverer than deliver those bytes to the output directory —
// but it refuses to deliver them if they would break the gate, and it proves
// the delivered copy is byte-for-byte the source before it exits.
//
// Run outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SRC = new URL('./entry.png', import.meta.url);
const OUT = join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png');

const MAX_BYTES = 1024 * 1024; // the gate takes at most 1 MiB
const MAX_SIDE = 1024; // and at most 1024 px on either side

const data = readFileSync(SRC);
if (data.length > MAX_BYTES) {
  throw new Error(`entry.png is ${data.length} bytes, over the 1 MiB gate`);
}

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

// JPEG dimensions live in the first Start-Of-Frame segment. Walk the marker
// stream from offset 2 (past the SOI marker ffd8) until a SOF marker turns up;
// anything else is skipped by its own length field.
function jpegDimensions(buf: Buffer): [number, number] {
  let pos = 2;
  while (pos + 9 <= buf.length) {
    if (buf[pos] !== 0xff) {
      pos += 1;
      continue;
    }
    const marker = buf[pos + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [buf.readUInt16BE(pos + 7), buf.readUInt16BE(pos + 5)];
    }
    pos += 2 + buf.readUInt16BE(pos + 2);
  }
  throw new Error('no JPEG Start-Of-Frame marker found in entry.png');
}

const [w, h] = jpegDimensions(data);
if (w > MAX_SIDE || h > MAX_SIDE) {
  throw new Error(`entry.png is ${w}x${h}, over the ${MAX_SIDE}x${MAX_SIDE} gate`);
}

copyFileSync(SRC, OUT);

if (sha256(readFileSync(SRC)) !== sha256(readFileSync(OUT))) {
  throw new Error('entry.png copy failed its sha256 integrity check');
}

console.log(`delivered entry.png ${w}x${h}, ${data.length} bytes, sha256 ${sha256(data)}`);
