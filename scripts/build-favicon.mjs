import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Build a single-size favicon.ico (PNG payload) from public/icon.png */
function pngToIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const root = resolve(import.meta.dirname, "..");
const png = readFileSync(resolve(root, "public/icon.png"));
const ico = pngToIco(png);
writeFileSync(resolve(root, "public/favicon.ico"), ico);
console.log(`Wrote public/favicon.ico (${ico.length} bytes)`);
