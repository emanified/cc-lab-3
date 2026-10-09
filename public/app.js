const $ = (id) => document.getElementById(id);
const menuEl = $("menu");
const filtersEl = $("filters");
const emptyEl = $("empty");
const countEl = $("count");
const trayEl = $("tray");
const trayText = $("tray-text");
const trayTotal = $("tray-total");
const refreshBtn = $("refresh");

const money = (n) => "Rs " + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

let records = [];
let activeCategory = "All";
const order = new Map(); // record id -> quantity

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const categories = () => [...new Set(records.map((r) => r.category || "Other"))];

function renderFilters() {
  filtersEl.innerHTML = "";
  if (!records.length) return;
  for (const cat of ["All", ...categories()]) {
    const b = el("button", "tab", cat);
    b.type = "button";
    b.setAttribute("aria-pressed", String(cat === activeCategory));
    b.addEventListener("click", () => {
      activeCategory = cat;
      renderFilters();
      renderMenu();
    });
    filtersEl.appendChild(b);
  }
}

function renderMenu() {
  menuEl.innerHTML = "";
  const cats = categories();
  const shown = activeCategory === "All" ? cats : cats.filter((c) => c === activeCategory);
  let total = 0;

  for (const cat of shown) {
    const items = records.filter((r) => (r.category || "Other") === cat);
    total += items.length;

    const group = el("section", "group");
    group.appendChild(el("h2", "", cat));
    const list = el("ul", "items");

    for (const r of items) {
      const li = el("li", "item");
      const body = el("div", "body");

      const line = el("div", "line");
      line.appendChild(el("h3", "", r.label));
      const qty = order.get(r.id);
      if (qty) line.appendChild(el("span", "qty", "×" + qty));
      line.appendChild(el("span", "leader"));
      line.appendChild(el("span", "price", money(r.value)));
      body.appendChild(line);
      if (r.note) body.appendChild(el("p", "note", r.note));

      const add = el("button", "add", "+");
      add.type = "button";
      add.setAttribute("aria-label", `Add ${r.label} to your order`);
      add.addEventListener("click", () => {
        order.set(r.id, (order.get(r.id) || 0) + 1);
        renderMenu();
        renderTray();
      });

      li.append(body, add);
      list.appendChild(li);
    }

    group.appendChild(list);
    menuEl.appendChild(group);
  }

  countEl.textContent = records.length ? `${total} ${total === 1 ? "item" : "items"}` : "";
}

function renderTray() {
  const lines = [];
  let sum = 0;
  for (const r of records) {
    const q = order.get(r.id);
    if (q) { lines.push(`${q}× ${r.label}`); sum += q * r.value; }
  }
  trayEl.hidden = lines.length === 0;
  trayText.textContent = lines.join(", ");
  trayTotal.textContent = money(sum);
}

$("clear-tray").addEventListener("click", () => {
  order.clear();
  renderMenu();
  renderTray();
});

async function load() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing…";
  try {
    const res = await fetch("/api/records");
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    records = (await res.json()).records;

    // forget order items that were removed from the menu
    const ids = new Set(records.map((r) => r.id));
    for (const id of order.keys()) if (!ids.has(id)) order.delete(id);
    if (activeCategory !== "All" && !categories().includes(activeCategory)) activeCategory = "All";

    emptyEl.hidden = records.length > 0;
    renderFilters();
    renderMenu();
    renderTray();
  } catch (err) {
    menuEl.textContent = `We couldn't load the menu. Please try again. (${err.message})`;
    countEl.textContent = "";
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh menu";
  }
}

$("year").textContent = new Date().getFullYear();
refreshBtn.addEventListener("click", load);
load();