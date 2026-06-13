/**
 * Lab 05 — RUM Collector Server
 * Receives Web Vitals beacons from the browser and logs them.
 *
 * Run: node javascript/web-vitals/labs/05-rum-collector.mjs
 * Then open 01-measure-vitals.html and POST vitals (or use the React VitalsDashboard).
 */

import http from 'http';

const PORT = 3460;
const vitalsStore = [];

const server = http.createServer(async (req, res) => {
  // CORS for local file / vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/vitals') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();

    try {
      const payload = JSON.parse(body);
      vitalsStore.push({ receivedAt: new Date().toISOString(), ...payload });
      console.log('[RUM]', JSON.stringify(payload));
      res.writeHead(204);
      res.end();
    } catch {
      res.writeHead(400);
      res.end('Invalid JSON');
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/vitals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(vitalsStore, null, 2));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`RUM collector running.\nPOST /vitals — send metric JSON\nGET /vitals — list received\n`);
});

server.listen(PORT, () => {
  console.log(`RUM collector on http://localhost:${PORT}`);
  console.log('POST metric example:');
  console.log(`curl -X POST http://localhost:${PORT}/vitals -H 'Content-Type: application/json' -d '{"name":"LCP","value":2100,"rating":"good"}'`);
});
