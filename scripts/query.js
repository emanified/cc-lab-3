#!/usr/bin/env node
// Query script: reads and writes the coffee shop menu through your API.
//
// Commands:
//   node scripts/query.js seed                              insert the sample menu (replaces existing)
//   node scripts/query.js add <name> <price> [category] [note]
//        e.g.  node scripts/query.js add "Hazelnut Latte" 680 Coffee "Nutty and sweet"
//   node scripts/query.js list                              print the menu
//   node scripts/query.js clear                             delete everything
//   node scripts/query.js health                            check the API is up
//
// Target server (default is local `netlify dev`):
//   PowerShell:  $env:BASE_URL="https://lab3cc.netlify.app"; node scripts/query.js list
//   cmd.exe:     set BASE_URL=https://lab3cc.netlify.app && node scripts/query.js list
//
// If you set ADMIN_KEY in Netlify, set the same value here:  $env:ADMIN_KEY="secret"

const BASE_URL = (process.env.BASE_URL || "http://localhost:8888").replace(/\/$/, "");

// Prices in PKR. Keep these the same as the products you create in Odoo.
const SAMPLE = [
  { label: "Espresso", value: 350, category: "Coffee", note: "A short, strong shot." },
  { label: "Cappuccino", value: 550, category: "Coffee", note: "Espresso, steamed milk and thick foam." },
  { label: "Caramel Latte", value: 650, category: "Coffee", note: "Smooth latte with a caramel drizzle." },
  { label: "Iced Spanish Latte", value: 700, category: "Cold", note: "Sweet condensed milk over iced espresso." },
  { label: "Iced Matcha", value: 700, category: "Cold", note: "Ceremonial matcha, cold milk, lots of ice." },
  { label: "Strawberry Milk", value: 500, category: "Cold", note: "Fresh strawberries blended with cold milk." },
  { label: "Chocolate Brownie", value: 450, category: "Treats", note: "Fudgy, warm, a little gooey." },
  { label: "Butter Croissant", value: 400, category: "Treats", note: "Flaky and baked every morning." },
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
      console.log(`Inserted ${r.saved} menu items (total now ${r.total}).`);
      break;
    }
    case "add": {
      const [label, price, category, note] = args;
      if (!label || price === undefined || Number.isNaN(Number(price))) {
        throw new Error('Usage: node scripts/query.js add "<name>" <price> [category] [note]');
      }
      const r = await call("POST", "/api/records", { label, value: Number(price), category, note });
      console.log(`Added "${label}". Menu now has ${r.total} items.`);
      break;
    }
    case "list": {
      const { records } = await call("GET", "/api/records");
      if (!records.length) return console.log("The menu is empty. Run: node scripts/query.js seed");
      console.table(records.map(({ label, value, category }) => ({ name: label, price: value, category })));
      break;
    }
    case "clear":
      await call("DELETE", "/api/records");
      console.log("Menu cleared.");
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