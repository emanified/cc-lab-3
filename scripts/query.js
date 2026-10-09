#!/usr/bin/env node
// Query script: reads and writes database values through your API.
//
// Commands:
//   node scripts/query.js seed                 insert sample values (replaces existing)
//   node scripts/query.js add <label> <value>  add one value, e.g.  add Jul 130
//   node scripts/query.js list                 print all values
//   node scripts/query.js clear                delete all values
//   node scripts/query.js health               check the API is up
//
// Target server (default is local `netlify dev`):
//   PowerShell:  $env:BASE_URL="https://YOUR-SITE.netlify.app"; node scripts/query.js list
//   cmd.exe:     set BASE_URL=https://YOUR-SITE.netlify.app && node scripts/query.js list
//
// If you set ADMIN_KEY in Netlify, set the same value here:  $env:ADMIN_KEY="secret"

const BASE_URL = (process.env.BASE_URL || "http://localhost:8888").replace(/\/$/, "");

const SAMPLE = [
  { label: "Jan", value: 42 },
  { label: "Feb", value: 58 },
  { label: "Mar", value: 51 },
  { label: "Apr", value: 74 },
  { label: "May", value: 96 },
  { label: "Jun", value: 88 },
  { label: "Jul", value: 121 },
  { label: "Aug", value: 109 },
];

async function call(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.ADMIN_KEY) headers["x-api-key"] = process.env.ADMIN_KEY;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${typeof data === "string" ? data.slice(0, 200) : JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const [cmd = "list", ...args] = process.argv.slice(2);
  console.log(`Server: ${BASE_URL}`);

  switch (cmd) {
    case "health":
      console.log(await call("GET", "/api/health"));
      break;
    case "seed": {
      const r = await call("POST", "/api/records", { records: SAMPLE, replace: true });
      console.log(`Inserted ${r.saved} records (total now ${r.total}).`);
      break;
    }
    case "add": {
      const [label, value] = args;
      if (!label || value === undefined || Number.isNaN(Number(value))) {
        throw new Error("Usage: node scripts/query.js add <label> <number>");
      }
      const r = await call("POST", "/api/records", { label, value: Number(value) });
      console.log(`Added. Total records: ${r.total}`);
      break;
    }
    case "list": {
      const { records } = await call("GET", "/api/records");
      if (!records.length) return console.log("No records yet. Run: node scripts/query.js seed");
      console.table(records.map(({ label, value, createdAt }) => ({ label, value, createdAt })));
      break;
    }
    case "clear":
      await call("DELETE", "/api/records");
      console.log("All records deleted.");
      break;
    default:
      throw new Error(`Unknown command "${cmd}". Try: seed, add, list, clear, health`);
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  if (/ECONNREFUSED|fetch failed/.test(err.message)) {
    console.error("Can't reach the server. Is `netlify dev` running, or is BASE_URL set to your live site?");
  }
  process.exit(1);
});