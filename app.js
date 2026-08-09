const titleEl = document.getElementById("siteTitle");
const subtitleEl = document.getElementById("siteSubtitle");
titleEl.textContent = SITE.title;
subtitleEl.textContent = SITE.subtitle;

const wrap = document.querySelector(".tree-wrap");
const tree = document.getElementById("tree");
const search = document.getElementById("search");
const dialog = document.getElementById("personDialog");
const details = document.getElementById("personDetails");

let scale = 1, offsetX = -350, offsetY = 0;
let dragging = false, startX = 0, startY = 0, startOX = 0, startOY = 0;

function childrenOf(id) {
  return PEOPLE.filter(p => (p.parents || []).includes(id));
}

function generations() {
  const memo = new Map();
  function gen(p) {
    if (memo.has(p.id)) return memo.get(p.id);
    if (!p.parents || p.parents.length === 0) return memo.set(p.id, 0).get(p.id);
    const parentPeople = p.parents.map(id => PEOPLE.find(x => x.id === id)).filter(Boolean);
    const g = parentPeople.length ? Math.max(...parentPeople.map(gen)) + 1 : 0;
    memo.set(p.id, g);
    return g;
  }
  PEOPLE.forEach(gen);
  return memo;
}

function layout() {
  tree.innerHTML = "";
  const gen = generations();
  const groups = new Map();
  PEOPLE.forEach(p => {
    const g = gen.get(p.id) || 0;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(p);
  });

  const xGap = 225, yGap = 155, maxW = Math.max(...[...groups.values()].map(a => a.length), 1) * xGap;
  const positions = new Map();

  [...groups.entries()].sort((a,b) => a[0]-b[0]).forEach(([g, arr]) => {
    const start = -((arr.length - 1) * xGap) / 2;
    arr.forEach((p, i) => positions.set(p.id, {x: start + i*xGap, y: g*yGap}));
  });

  // Canvas-like SVG for connectors.
  const maxDepth = Math.max(...gen.values(), 0);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("lines");
  svg.style.left = "0"; svg.style.top = "0";
  svg.setAttribute("width", Math.max(maxW + 500, 1400));
  svg.setAttribute("height", (maxDepth + 1) * yGap + 180);

  for (const p of PEOPLE) {
    const child = positions.get(p.id);
    if (!child) continue;
    for (const pid of (p.parents || [])) {
      const parent = positions.get(pid);
      if (!parent) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const x1 = parent.x, y1 = parent.y + 85;
      const x2 = child.x, y2 = child.y;
      const mid = (y1 + y2) / 2;
      path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);
      path.classList.add("line");
      svg.appendChild(path);
    }
  }
  tree.appendChild(svg);

  PEOPLE.forEach(p => {
    const pos = positions.get(p.id);
    const el = document.createElement("button");
    el.type = "button";
    el.className = "node";
    el.dataset.id = p.id;
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.innerHTML = `
      ${p.photo ? `<img src="${escapeAttr(p.photo)}" alt="">` : ""}
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="dates">${escapeHtml(p.birth || "")}${p.birth && p.death ? "–" : ""}${escapeHtml(p.death || "")}</div>
    `;
    el.addEventListener("click", () => showPerson(p));
    tree.appendChild(el);
  });
  applyTransform();
}

function showPerson(p) {
  details.innerHTML = `
    ${p.photo ? `<img src="${escapeAttr(p.photo)}" alt="">` : ""}
    <h2>${escapeHtml(p.name)}</h2>
    <div class="detail"><strong>Dzimšana:</strong> ${escapeHtml(p.birth || "—")}</div>
    <div class="detail"><strong>Miršana:</strong> ${escapeHtml(p.death || "—")}</div>
    <div class="detail"><strong>Vieta:</strong> ${escapeHtml(p.place || "—")}</div>
    <p>${escapeHtml(p.bio || "")}</p>
  `;
  dialog.showModal();
}

function applyTransform() {
  tree.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function setScale(v) {
  scale = Math.max(0.45, Math.min(1.8, v));
  document.getElementById("zoomReset").textContent = `${Math.round(scale*100)}%`;
  applyTransform();
}
document.getElementById("zoomIn").onclick = () => setScale(scale + .1);
document.getElementById("zoomOut").onclick = () => setScale(scale - .1);
document.getElementById("zoomReset").onclick = () => { scale = 1; offsetX = -350; offsetY = 0; applyTransform(); document.getElementById("zoomReset").textContent="100%"; };
document.getElementById("closeDialog").onclick = () => dialog.close();

wrap.addEventListener("pointerdown", e => {
  if (e.target.closest(".node")) return;
  dragging = true; wrap.classList.add("dragging");
  startX = e.clientX; startY = e.clientY; startOX = offsetX; startOY = offsetY;
  wrap.setPointerCapture(e.pointerId);
});
wrap.addEventListener("pointermove", e => {
  if (!dragging) return;
  offsetX = startOX + (e.clientX - startX);
  offsetY = startOY + (e.clientY - startY);
  applyTransform();
});
wrap.addEventListener("pointerup", () => { dragging = false; wrap.classList.remove("dragging"); });

search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  document.querySelectorAll(".node").forEach(n => {
    const p = PEOPLE.find(x => x.id === n.dataset.id);
    n.classList.toggle("highlight", !!q && p.name.toLowerCase().includes(q));
  });
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

layout();
