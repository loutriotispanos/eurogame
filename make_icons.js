/*
 * Generates icon-192.png and icon-512.png (a basketball, matching the app theme)
 * for the PWA manifest / Add-to-Home-Screen. Zero deps — hand-rolls the PNG.
 *
 *   Run:  node make_icons.js
 */
const fs = require("fs");
const zlib = require("zlib");

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
function png(size, pixel) {
  var raw = Buffer.alloc(size * (size * 4 + 1)), o = 0;
  for (var y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (var x = 0; x < size; x++) { var p = pixel(x, y); raw[o++] = p[0]; raw[o++] = p[1]; raw[o++] = p[2]; raw[o++] = p[3]; }
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  var sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Dark square (maskable-safe) with a centred orange basketball + black seams.
function basketball(size) {
  var cx = size / 2, cy = size / 2, R = size * 0.40;
  var seam = Math.max(2, size * 0.020);
  var bg = [14, 15, 19, 255], orange = [255, 122, 0, 255], dark = [12, 10, 6, 255];
  var off = R * 1.25, arcR = Math.sqrt(off * off + R * R); // side seams pass through the ball's top/bottom
  return png(size, function (x, y) {
    var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (d > R) return bg;
    if (R - d <= seam) return dark;                  // outline
    if (Math.abs(dx) <= seam) return dark;           // vertical seam
    if (Math.abs(dy) <= seam) return dark;           // horizontal seam
    var dl = Math.abs(Math.sqrt((x - (cx - off)) * (x - (cx - off)) + dy * dy) - arcR);
    var dr = Math.abs(Math.sqrt((x - (cx + off)) * (x - (cx + off)) + dy * dy) - arcR);
    if (dl <= seam || dr <= seam) return dark;       // curved side seams
    return orange;
  });
}

[192, 512].forEach(function (s) { fs.writeFileSync("icon-" + s + ".png", basketball(s)); });

// Self-check: re-parse our output so a broken encoder fails loudly.
[192, 512].forEach(function (s) {
  var b = fs.readFileSync("icon-" + s + ".png");
  var sigOk = b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  var w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  var idatLen = b.readUInt32BE(33);
  var idat = b.slice(41, 41 + idatLen);
  var rawLen = zlib.inflateSync(idat).length;
  if (!sigOk || w !== s || h !== s || rawLen !== s * (s * 4 + 1)) throw new Error("icon-" + s + " failed self-check");
  console.log("icon-" + s + ".png OK (" + b.length + " bytes, " + w + "x" + h + ")");
});
