#!/usr/bin/env node
/*
 * Brand asset generator.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Rasterises the logo artwork declared by `src/app/icon.svg` using nothing but
 * Node's built-in `zlib` (a small PNG encoder plus a PNG-in-ICO container), so
 * the repository ships real binary icons without depending on sharp/canvas.
 *
 * Outputs
 *   src/app/favicon.ico      16 / 32 / 48 px multi-image icon (browser tab)
 *   src/app/apple-icon.png   180 px (iOS home screen)
 *   public/icon-192.png      192 px (installable PWA / Android)
 *   public/icon-512.png      512 px (installable PWA / store listing)
 *
 * Everything is drawn at 4x and box-filtered down, which is what gives the
 * small sizes their smooth edges.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(scriptDir, "..");
const appDir = path.join(frontendDir, "src", "app");
const publicDir = path.join(frontendDir, "public");

/* ------------------------------------------------------------------ artwork */

/** Tile gradient, mirroring `icon.svg` (indigo -> violet). */
const GRADIENT = [
  [0x63, 0x66, 0xf1],
  [0x4f, 0x46, 0xe5],
  [0x7c, 0x3a, 0xed],
];

/** Design grid the SVG paths are authored on. */
const VIEWBOX = 64;
/** Tile corner radius in design units (matches `rx="15"`). */
const CORNER_RADIUS = 15;
/** Stroke width in design units (matches `stroke-width="5.2"`). */
const STROKE = 5.2;

/**
 * SkillGauge mark, drawn as strokes on the 64-unit design grid.
 *
 * It mirrors `src/app/icon.svg` exactly — a dial arc, a needle reading 50° and
 * a hub — so the rasterised PNG/ICO icons match the inline SVG in the app.
 */
const GAUGE = { cx: 32, cy: 38, r: 17, from: 200, to: -20, steps: 36 };
const NEEDLE_FROM = [32, 38];
/** 50° at radius 15 — the needle sits just inside the dial arc. */
const NEEDLE_TO = [41.64, 26.51];
const HUB = { x: 32, y: 38, r: 4 };

const WHITE = [255, 255, 255];
const NEEDLE_COLOR = [0xa5, 0xf3, 0xfc];

/** Polyline approximation of the dial arc (angles in degrees, y-axis down). */
function arcPoints({ cx, cy, r, from, to, steps }) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    points.push([cx + r * Math.cos(angle), cy - r * Math.sin(angle)]);
  }
  return points;
}

const GLYPH_STROKES = [
  { color: WHITE, points: arcPoints(GAUGE) },
  { color: NEEDLE_COLOR, points: [NEEDLE_FROM, NEEDLE_TO] },
];

const GLYPH_DOTS = [{ ...HUB, color: WHITE }];

const SUPERSAMPLE = 4;

/** Linear blend between two RGB triples. */
function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Tile colour at a normalised diagonal position `t` (0..1). */
function tileColor(t) {
  if (t <= 0.5) return mix(GRADIENT[0], GRADIENT[1], t / 0.5);
  return mix(GRADIENT[1], GRADIENT[2], (t - 0.5) / 0.5);
}

/** Distance from a point to the closest point on a line segment. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** True when a design-space point is inside the rounded tile. */
function insideTile(x, y) {
  const half = VIEWBOX / 2;
  const dx = Math.abs(x - half);
  const dy = Math.abs(y - half);
  const limit = half - CORNER_RADIUS;
  if (dx <= limit || dy <= limit) return true;
  return Math.hypot(dx - limit, dy - limit) <= CORNER_RADIUS;
}

/** Glyph colour at a design-space point, or `null` when the pixel is bare tile. */
function glyphAt(x, y) {
  const radius = STROKE / 2;
  for (const stroke of GLYPH_STROKES) {
    for (let i = 0; i < stroke.points.length - 1; i += 1) {
      const [ax, ay] = stroke.points[i];
      const [bx, by] = stroke.points[i + 1];
      if (distanceToSegment(x, y, ax, ay, bx, by) <= radius) return stroke.color;
    }
  }
  for (const dot of GLYPH_DOTS) {
    if (Math.hypot(x - dot.x, y - dot.y) <= dot.r) return dot.color;
  }
  return null;
}

/** Renders one square RGBA buffer of `size` px. */
function render(size) {
  const scale = VIEWBOX / size;
  const pixels = Buffer.alloc(size * size * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const x = (px + (sx + 0.5) / SUPERSAMPLE) * scale;
          const y = (py + (sy + 0.5) / SUPERSAMPLE) * scale;
          if (!insideTile(x, y)) continue;

          const color =
            glyphAt(x, y) ?? tileColor((x / VIEWBOX + y / VIEWBOX) / 2);
          r += color[0];
          g += color[1];
          b += color[2];
          hits += 1;
        }
      }

      const index = (py * size + px) * 4;
      // Un-premultiply so the edges keep their colour at low alpha.
      pixels[index] = hits === 0 ? 0 : Math.round(r / hits);
      pixels[index + 1] = hits === 0 ? 0 : Math.round(g / hits);
      pixels[index + 2] = hits === 0 ? 0 : Math.round(b / hits);
      pixels[index + 3] = Math.round((hits / samples) * 255);
    }
  }

  return pixels;
}


/* -------------------------------------------------------------- PNG encoder */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Encodes an RGBA buffer as an 8-bit truecolour PNG. */
function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- ICO encoder */

/**
 * Packs PNG images into an ICO container.
 *
 * Every size is stored as a PNG (understood by every current browser and by
 * Windows Vista+), which keeps this generator dependency-free.
 */
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = [];

  for (const { size, data } of entries) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // width  (0 means 256)
    entry[1] = size >= 256 ? 0 : size; // height
    entry[2] = 0; // palette size
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    directory.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.data)]);
}

/* ------------------------------------------------------------------- outputs */

function writePng(target, size) {
  const png = encodePng(size, render(size));
  fs.writeFileSync(target, png);
  console.log(`ok    ${path.relative(frontendDir, target)} (${size}x${size}, ${png.length} bytes)`);
}

const ico = encodeIco(
  [16, 32, 48].map((size) => ({ size, data: encodePng(size, render(size)) })),
);
fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);
console.log(`ok    src/app/favicon.ico (16/32/48, ${ico.length} bytes)`);

writePng(path.join(appDir, "apple-icon.png"), 180);
writePng(path.join(publicDir, "icon-192.png"), 192);
writePng(path.join(publicDir, "icon-512.png"), 512);
