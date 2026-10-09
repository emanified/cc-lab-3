// Backend: one Netlify Function that handles every /api/* route.
// Serverless = stateless, so nothing here is saved between requests.
// For persistent data later, connect a database (Supabase, Netlify Blobs, etc).

const ITEMS = [
  { id: 1, title: "Frontend", detail: "Static files served from /public" },
  { id: 2, title: "Backend", detail: "This Netlify Function (netlify/functions/api.js)" },
  { id: 3, title: "Query script", detail: "scripts/query.js calls this API from the terminal" },
];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  // event.path looks like /.netlify/functions/api/hello or /api/hello
  const route = event.path.replace(/^.*\/api/, "") || "/";

  if (event.httpMethod === "OPTIONS") return json(204, {});

  if (route === "/health") {
    return json(200, { ok: true, time: new Date().toISOString() });
  }

  if (route === "/hello") {
    const name = (event.queryStringParameters?.name || "world").slice(0, 50);
    return json(200, { message: `Hello, ${name}!`, time: new Date().toISOString() });
  }

  if (route === "/items") {
    return json(200, { items: ITEMS });
  }

  return json(404, { error: `No route for ${route}` });
};
