const form = document.getElementById("hello-form");
const result = document.getElementById("hello-result");
const list = document.getElementById("items");

async function api(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = new FormData(form).get("name").trim() || "world";
  try {
    const data = await api(`/hello?name=${encodeURIComponent(name)}`);
    result.textContent = data.message;
  } catch (err) {
    result.textContent = `Could not reach the backend: ${err.message}`;
  }
});

(async () => {
  try {
    const { items } = await api("/items");
    list.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.innerHTML = `<strong></strong><span></span>`;
      li.querySelector("strong").textContent = item.title;
      li.querySelector("span").textContent = item.detail;
      list.appendChild(li);
    }
  } catch (err) {
    list.innerHTML = `<li>Could not load items: ${err.message}</li>`;
  }
})();
