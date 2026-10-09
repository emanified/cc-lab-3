const $ = (id) => document.getElementById(id);
const chartEl = $("chart");
const statsEl = $("stats");
const table = $("table");
const tbody = table.querySelector("tbody");
const emptyEl = $("empty");
const refreshBtn = $("refresh");
const mascot = $("mascot");
const bubble = $("bubble");

const CHART_MAX_BARS = 12;
const COLOR_COUNT = 5;

const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function fetchRecords() {
  const res = await fetch("/api/records");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()).records;
}

function setMood(sleepy, text) {
  mascot.classList.toggle("sleepy", sleepy);
  bubble.textContent = text;
}

function renderStats(records) {
  const values = records.map((r) => r.value);
  const total = values.reduce((a, b) => a + b, 0);
  const items = [
    ["🌸", "Records", records.length],
    ["✨", "Total", fmt(total)],
    ["🍡", "Average", fmt(total / values.length)],
    ["⭐", "Highest", fmt(Math.max(...values))],
  ];
  statsEl.innerHTML = items
    .map(
      ([icon, label, value], i) =>
        `<div class="stat s${i}"><span class="icon" aria-hidden="true">${icon}</span><strong>${value}</strong><span class="k">${label}</span></div>`
    )
    .join("");
}

function renderChart(records) {
  const offset = Math.max(records.length - CHART_MAX_BARS, 0);
  const data = records.slice(offset);

  const W = 640, H = 320;
  const pad = { t: 44, r: 12, b: 40, l: 12 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const baseY = pad.t + innerH;

  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  const bestIdx = data.findIndex((d) => d.value === max);
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.62, 56);

  const grid = [0.5, 1]
    .map((f) => {
      const y = baseY - f * innerH;
      return `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" />`;
    })
    .join("");

  const bars = data
    .map((d, i) => {
      const h = Math.max((Math.max(d.value, 0) / max) * innerH, 8);
      const x = pad.l + i * slot + (slot - barW) / 2;
      const y = baseY - h;
      const cx = x + barW / 2;
      const color = (offset + i) % COLOR_COUNT;
      const label = d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label;
      const star =
        i === bestIdx && max > 0
          ? `<text class="star" style="--i:${i}" x="${cx}" y="${y - 26}" text-anchor="middle">⭐</text>`
          : "";
      return `
        <rect class="bar c${color}" style="--i:${i}" x="${x}" y="${y}" width="${barW}" height="${h}" rx="${barW / 2}">
          <title>${esc(d.label)}: ${fmt(d.value)}</title>
        </rect>
        ${star}
        <text class="val" style="--i:${i}" x="${cx}" y="${y - 8}" text-anchor="middle">${fmt(d.value)}</text>
        <text x="${cx}" y="${H - 14}" text-anchor="middle">${esc(label)}</text>`;
    })
    .join("");

  chartEl.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      <line class="base" x1="${pad.l}" x2="${W - pad.r}" y1="${baseY}" y2="${baseY}" />
      ${bars}
    </svg>`;
}

function renderTable(records) {
  tbody.innerHTML = "";
  const n = records.length;
  for (let i = n - 1; i >= 0; i--) {
    const r = records[i];
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    const dot = document.createElement("span");
    dot.className = `dot c${i % COLOR_COUNT}`;
    tdLabel.append(dot, r.label);

    const tdValue = document.createElement("td");
    tdValue.className = "num";
    tdValue.textContent = fmt(r.value);

    const tdDate = document.createElement("td");
    tdDate.textContent = new Date(r.createdAt).toLocaleString();

    tr.append(tdLabel, tdValue, tdDate);
    tbody.appendChild(tr);
  }
}

async function load() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Refreshing…";
  try {
    const records = await fetchRecords();
    const has = records.length > 0;

    emptyEl.hidden = has;
    table.hidden = !has;
    statsEl.innerHTML = "";
    chartEl.innerHTML = "";

    if (has) {
      const best = records.reduce((a, b) => (b.value > a.value ? b : a));
      setMood(false, `Yay, ${records.length} numbers! The biggest is ${best.label} (${fmt(best.value)}).`);
      renderStats(records);
      renderChart(records);
      renderTable(records);
    } else {
      setMood(true, "Zzz… I'm hungry for numbers. Feed me some!");
    }
  } catch (err) {
    setMood(true, "Oh no, I couldn't reach the database.");
    chartEl.textContent = `Could not load records: ${err.message}`;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh";
  }
}

refreshBtn.addEventListener("click", load);
load();