// ai-excited-01 entry (Node 22, standard library only): the image is the entry.png
// beside this file — a colossal humpback whale breaching out of a framed seascape
// painting in a sunlit gallery, spray exploding, a small boy reaching up toward it —
// and the program copies it to /output/entry.png. The gate takes a whole JPEG or PNG
// of at most 1 MiB and 1024 by 1024 pixels, and the judge sees exactly the bytes
// copied, so the copy is verified byte for byte against the source before the
// program exits.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const source = new URL('./entry.png', import.meta.url);
const dest = join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png');

// The gate refuses anything over 1 MiB, so refuse to hand over an oversize file.
const bytes = readFileSync(source);
if (bytes.length > 1048576) {
  throw new Error('entry.png exceeds the 1 MiB gate');
}

// The gate also caps dimensions at 1024 by 1024: read them from the JPEG SOF
// marker (entry.png holds JPEG bytes, magic ffd8ff) and refuse an oversize frame.
const jpegSize = (buf: Buffer): [number, number] => {
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('entry.png has no JPEG SOF marker');
};
const [width, height] = jpegSize(bytes);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate`);
}

copyFileSync(source, dest);

const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
if (sha(readFileSync(source)) !== sha(readFileSync(dest))) {
  throw new Error('entry.png copy failed integrity check');
}
