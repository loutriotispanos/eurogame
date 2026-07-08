/*
 * Generates og-image.png — the 1200x630 social-share preview (Open Graph /
 * Twitter card) referenced by index.html. Zero deps — hand-rolls the PNG the
 * same way make_icons.js does, plus a tiny 5x7 bitmap font, the app's
 * basketball, and a Wordle-style results row. Supersampled 4x for smooth edges.
 *
 *   Run:  node make_og.js
 */
const fs = require("fs");
const zlib = require("zlib");

// --- PNG encoder (RGBA, any size) ------------------------------------------
function crc32(buf) {
  var t = crc32.t || (crc32.t = (function () {
    var tbl = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tbl[n] = c >>> 0; }
    return tbl;
  })());
  var c = 0xFFFFFFFF;
  for (var i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  var tt = Buffer.from(type, "ascii");
  var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tt, data])), 0);
  return Buffer.concat([len, tt, data, crc]);
}
function pngRGBA(w, h, rgba) {            // rgba: Uint8 buffer length w*h*4
  var raw = Buffer.alloc(h * (w * 4 + 1)), o = 0, p = 0;
  for (var y = 0; y < h; y++) { raw[o++] = 0; for (var x = 0; x < w * 4; x++) raw[o++] = rgba[p++]; }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  var sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// --- 5x7 bitmap font (uppercase + digits + a couple of symbols) ------------
var FONT = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["11111", "00010", "00010", "00010", "00010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "·": ["00000", "00000", "00000", "00100", "00000", "00000", "00000"] // middot separator
};
function textWidth(str, scale) { return (str.length * 6 - 1) * scale; } // 5 cols + 1 gap per char

// --- Composition ------------------------------------------------------------
var SS = 4;                         // supersample factor (downscaled at the end → anti-aliasing)
var FW = 1200, FH = 630;
var W = FW * SS, H = FH * SS;
function s(v) { return v * SS; }    // final-space value → supersample-space

function pack(r, g, b) { return ((r | 0) << 16) | ((g | 0) << 8) | (b | 0); }
var WHITE = pack(241, 242, 244), ORANGE = pack(255, 122, 0), MUTED = pack(160, 167, 178);
var GREEN = pack(76, 154, 82), YELLOW = pack(201, 162, 43), GREY = pack(64, 68, 78);
var DARK = pack(12, 10, 6), TEXTCOL = [0, WHITE, ORANGE, MUTED];

// Text mask: each supersample pixel tagged with a colour id (0 = none).
var mask = new Uint8Array(W * H);
function stamp(str, fx, fy, scale, id) {
  var X0 = s(fx), Y0 = s(fy), S = s(scale);
  for (var i = 0; i < str.length; i++) {
    var g = FONT[str[i]] || FONT[" "];
    var cx = X0 + i * 6 * S;
    for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) {
      if (g[r][c] === "1") {
        var px0 = cx + c * S, py0 = Y0 + r * S;
        for (var yy = 0; yy < S; yy++) { var row = (py0 + yy) * W; for (var xx = 0; xx < S; xx++) mask[row + px0 + xx] = id; }
      }
    }
  }
}

// Headline lockup (mirrors the app's orange "Euro" + white rest).
var ST = 11, TLx = 84, TLy = 132;
stamp("EURO", TLx, TLy, ST, 2);
stamp("LEAGUE", TLx + textWidth("EURO", ST) + 6 * ST - 5 * ST, TLy, ST, 1); // continue same word, one char gap
stamp("GUESSER", TLx, TLy + 7 * ST + 22, ST, 1);
var TAGy = TLy + 2 * (7 * ST) + 22 + 34, TAGs = 4;
stamp("GUESS THE PLAYER IN 8 TRIES", TLx, TAGy, TAGs, 3);
var MODES = "DAILY · PRACTICE · LEGENDS · ENDLESS";
stamp(MODES, TLx, 540, 2, 3);

// Basketball (right side), in supersample space.
var BX = s(1010), BY = s(238), BR = s(150), SEAM = Math.max(2 * SS, BR * 0.02);
var OFF = BR * 1.25, ARCR = Math.sqrt(OFF * OFF + BR * BR);
function ballAt(X, Y) {
  var dx = X - BX, dy = Y - BY, d = Math.sqrt(dx * dx + dy * dy);
  if (d > BR) return -1;
  if (BR - d <= SEAM) return DARK;
  if (Math.abs(dx) <= SEAM || Math.abs(dy) <= SEAM) return DARK;
  var dl = Math.abs(Math.sqrt((dx + OFF) * (dx + OFF) + dy * dy) - ARCR);
  var dr = Math.abs(Math.sqrt((dx - OFF) * (dx - OFF) + dy * dy) - ARCR);
  if (dl <= SEAM || dr <= SEAM) return DARK;
  return ORANGE;
}

// Results row of guess tiles, each with the app's colour-blind glyph (check / tilde / dot).
var TS = s(82), TG = s(16), TY = s(412), TX0 = s(84), TR = s(14);
var TILES = [
  { fill: GREEN, mark: "check" }, { fill: YELLOW, mark: "tilde" }, { fill: GREY, mark: "dot" },
  { fill: YELLOW, mark: "tilde" }, { fill: GREEN, mark: "check" }
];
function segDist(px, py, ax, ay, bx, by) {
  var vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  var t = (wx * vx + wy * vy) / (vx * vx + vy * vy); t = t < 0 ? 0 : t > 1 ? 1 : t;
  var cx = ax + t * vx, cy = ay + t * vy; return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
}
function tileAt(X, Y) {
  for (var i = 0; i < TILES.length; i++) {
    var x = TX0 + i * (TS + TG), y = TY;
    if (X < x || X >= x + TS || Y < y || Y >= y + TS) continue;
    var dx = (X < x + TR) ? (x + TR - X) : (X > x + TS - TR ? X - (x + TS - TR) : 0);
    var dy = (Y < y + TR) ? (y + TR - Y) : (Y > y + TS - TR ? Y - (y + TS - TR) : 0);
    if (dx * dx + dy * dy > TR * TR) continue;             // outside the rounded corner
    var u = (X - x) / TS, v = (Y - y) / TS, t = 0.085;      // glyph in normalised tile space
    var ink = (TILES[i].fill === YELLOW || TILES[i].fill === GREEN) ? DARK : WHITE;
    if (TILES[i].mark === "check") {
      var d = Math.min(segDist(u, v, 0.26, 0.52, 0.44, 0.70), segDist(u, v, 0.44, 0.70, 0.76, 0.30));
      if (d <= t) return ink;
    } else if (TILES[i].mark === "tilde") {
      if (Math.abs(v - 0.5) <= t && u >= 0.27 && u <= 0.73) return ink;
    } else { // dot
      var ddx = u - 0.5, ddy = v - 0.5; if (ddx * ddx + ddy * ddy <= 0.13 * 0.13) return ink;
    }
    return TILES[i].fill;
  }
  return -1;
}

// Background: app's dark panel with a soft top-centre glow.
var GX = W * 0.5, GY = -H * 0.08, RG2 = (W * 0.62) * (W * 0.62);
function grad(X, Y) {
  var tt = Y / H;
  var br = 24 + (14 - 24) * tt, bg = 26 + (15 - 26) * tt, bb = 32 + (19 - 32) * tt;
  var dx = X - GX, dy = Y - GY, a = 1 - (dx * dx + dy * dy) / RG2; if (a < 0) a = 0; a = a * a * 0.85;
  return pack(br + (32 - br) * a, bg + (36 - bg) * a, bb + (47 - bb) * a);
}

function colorAt(X, Y) {
  var m = mask[Y * W + X]; if (m) return TEXTCOL[m];
  if (Y >= TY && Y < TY + TS) { var t = tileAt(X, Y); if (t !== -1) return t; }   // tiles row band
  if (X > BX - BR && X < BX + BR && Y > BY - BR && Y < BY + BR) { var b = ballAt(X, Y); if (b !== -1) return b; }
  return grad(X, Y);
}

// Render + box-downsample (SSxSS average) → final RGBA.
var out = Buffer.alloc(FW * FH * 4), oi = 0, n = SS * SS;
for (var fy = 0; fy < FH; fy++) {
  for (var fx = 0; fx < FW; fx++) {
    var r = 0, g = 0, b = 0;
    for (var sy = 0; sy < SS; sy++) { var Y = fy * SS + sy;
      for (var sx = 0; sx < SS; sx++) { var c = colorAt(fx * SS + sx, Y); r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; } }
    out[oi++] = Math.round(r / n); out[oi++] = Math.round(g / n); out[oi++] = Math.round(b / n); out[oi++] = 255;
  }
}

var buf = pngRGBA(FW, FH, out);
fs.writeFileSync("og-image.png", buf);

// Self-check: re-parse our output so a broken encoder fails loudly.
var b = fs.readFileSync("og-image.png");
var sigOk = b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
var w = b.readUInt32BE(16), h = b.readUInt32BE(20), idatLen = b.readUInt32BE(33);
var rawLen = zlib.inflateSync(b.slice(41, 41 + idatLen)).length;
if (!sigOk || w !== FW || h !== FH || rawLen !== FH * (FW * 4 + 1)) throw new Error("og-image failed self-check");
console.log("og-image.png OK (" + b.length + " bytes, " + w + "x" + h + ")");
