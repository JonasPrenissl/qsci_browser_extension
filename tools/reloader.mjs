import { WebSocketServer } from "ws";
import chokidar from "chokidar";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 35729;
const DIST = path.resolve(__dirname, ".."); // Watch the repository root (since extension loads from root)

// Create HTTP server to serve dev-reload.js
const server = http.createServer((req, res) => {
  if (req.url === "/dev-reload.js") {
    const devReloadPath = path.join(__dirname, "..", "src", "dev-reload.js");
    fs.readFile(devReloadPath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Create WebSocket server on the same HTTP server
const wss = new WebSocketServer({ server });
const broadcast = (msg) =>
  wss.clients.forEach((c) => c.readyState === 1 && c.send(msg));

chokidar
  .watch(DIST, { 
    ignoreInitial: true,
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/tools/**',
      '**/src/**',  // Ignore source files, only watch output/root files
      '**/*.log',
      '**/*.md',
      '**/test-*.js',
      '**/verify-*.js',
      '**/build.js',
      '**/webpack.config.js'
    ]
  })
  .on("all", (event, filepath) => {
    console.log(`[reloader] ${event}: ${path.relative(DIST, filepath)}`);
    broadcast("reload-extension");
  });

server.listen(PORT, () => {
  console.log(`[reloader] HTTP server serving dev-reload.js on http://localhost:${PORT}/dev-reload.js`);
  console.log(`[reloader] WebSocket server broadcasting on ws://localhost:${PORT}`);
  console.log(`[reloader] watching ${DIST} for changes`);
});

