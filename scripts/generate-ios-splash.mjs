/**
 * Generates solid-color iOS PWA splash PNGs matching manifest background_color.
 * Run: npm run generate:splash
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "splash");
const BG = "#f8fafc";

/** Pixel size only; metadata lives in app/layout.tsx */
const SIZES = [
  [640, 1136],
  [750, 1334],
  [828, 1792],
  [1125, 2436],
  [1170, 2532],
  [1179, 2556],
  [1242, 2688],
  [1284, 2778],
  [1290, 2796],
  [1536, 2048],
  [1668, 2388],
  [2048, 2732],
];

await mkdir(OUT, { recursive: true });

for (const [w, h] of SIZES) {
  const name = `launch-${w}x${h}.png`;
  await sharp({
    create: { width: w, height: h, channels: 3, background: BG },
  })
    .png()
    .toFile(join(OUT, name));
  console.log("wrote", name);
}
