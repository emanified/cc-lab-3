#!/usr/bin/env node
// Query script: calls your API from the terminal.
//
// Usage:
//   node scripts/query.js                      -> hits /api/health
//   node scripts/query.js hello Ada            -> /api/hello?name=Ada
//   node scripts/query.js items                -> /api/items
//
// Point it at a different server with BASE_URL:
//   BASE_URL=https://your-site.netlify.app node scripts/query.js items
//
// Default is the local `netlify dev` server.

const BASE_URL = (process.env.BASE_URL || "http://localhost:8888").replace(/\/$/, "");

async function main() {
  const [cmd = "health", arg] = process.argv.slice(2);
  const routes = {
    health: "/api/health",
    items: "/api/items",
    hello: `/api/hello?name=${encodeURIComponent(arg || "world")}`,
  };

  if (!routes[cmd]) {
    console.error(`Unknown command "${cmd}". Try: ${Object.keys(routes).join(", ")}`);
    process.exit(1);
  }

  const url = BASE_URL + routes[cmd];
  console.log(`GET ${url}`);

  const res = await fetch(url);
  const body = await res.text();
  console.log(`Status: ${res.status}`);
  try { console.log(JSON.stringify(JSON.parse(body), null, 2)); }
  catch { console.log(body); }
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error("Query failed:", err.message);
  console.error("Is the server running / is BASE_URL correct?");
  process.exit(1);
});
