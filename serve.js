/*
 * Tiny zero-dependency static server so you can play on your phone over Wi-Fi.
 *
 *   Run:   node serve.js
 *   Then:  on a phone on the SAME Wi-Fi, open  http://<this-PC's-LAN-IP>:8000
 *          (run `ipconfig` and use the IPv4 Address, e.g. 192.168.1.23)
 *
 * Stop it with Ctrl+C. First run may pop a Windows Firewall prompt —
 * click "Allow access" for Private networks so your phone can connect.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

http.createServer(function (req, res) {
  var rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  var file = path.join(ROOT, path.normalize(rel));
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate"   // dev: never let the browser serve a stale build
    });
    res.end(data);
  });
}).listen(PORT, "0.0.0.0", function () {
  console.log("EuroLeague Guesser served from " + ROOT);
  console.log("On this PC:  http://localhost:" + PORT);
  console.log("On your phone (same Wi-Fi): http://<this-PC-LAN-IP>:" + PORT + "  (see ipconfig IPv4 Address)");
});
