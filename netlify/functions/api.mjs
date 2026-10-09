// Backend: one Netlify Function handling every /api/* route.
// Data lives in Netlify Blobs (a key-value store built into Netlify).
//
// Routes:
//   GET    /api/health
//   GET    /api/records                       -> list all records
//   POST   /api/records  {label, value, category?, note?}  -> add one record
//   POST   /api/records  {records:[...], replace:true}  -> add many (optionally replacing all)
//   DELETE /api/records                       -> delete all records
//
// Optional protection: set an ADMIN_KEY environment variable in Netlify and
// writes (POST/DELETE) will require a matching "x-api-key" header.

import { getStore } from "@netlify/blobs";

const KEY = "all";
const MAX_RECORDS = 200;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const load = async () => (await getStore("records").get(KEY, { type: "json" })) || [];
const save = (records) => getStore("records").setJSON(KEY, records);

function clean(input) {
  const label = String(input?.label ?? "").trim().slice(0, 50);
  const value = Number(input?.value);
  if (!label || !Number.isFinite(value) || value < 0) return null;
  const category = String(input?.category ?? "").trim().slice(0, 30) || "Other";
  const note = String(input?.note ?? "").trim().slice(0, 120);
  return { id: crypto.randomUUID(), label, value, category, note, createdAt: new Date().toISOString() };
}

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api/, "") || "/";

  if (route === "/health") return json({ ok: true, time: new Date().toISOString() });

  if (route !== "/records") return json({ error: `No route for ${route}` }, 404);

  if (req.method !== "GET" && process.env.ADMIN_KEY) {
    if (req.headers.get("x-api-key") !== process.env.ADMIN_KEY) {
      return json({ error: "Unauthorized: missing or wrong x-api-key" }, 401);
    }
  }

  try {
    if (req.method === "GET") {
      return json({ records: await load() });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "Body must be JSON" }, 400);

      const incoming = Array.isArray(body.records) ? body.records : [body];
      const cleaned = incoming.map(clean);
      if (cleaned.some((r) => r === null)) {
        return json({ error: "Each record needs a name (label) and a price (number, 0 or more)" }, 400);
      }

      const existing = body.replace ? [] : await load();
      const records = [...existing, ...cleaned].slice(-MAX_RECORDS);
      await save(records);
      return json({ saved: cleaned.length, total: records.length }, 201);
    }

    if (req.method === "DELETE") {
      await save([]);
      return json({ deleted: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: "Server error: " + err.message }, 500);
  }
};

// Serve this function at /api/* (no redirect rules needed).
export const config = { path: "/api/*" };