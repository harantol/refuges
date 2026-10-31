const API = "https://www.refuges.info/api";
const NB_POINTS_MAX = 500;

const TYPE_COLORS = {
  1: "#e6194b", 2: "#3cb44b", 3: "#4363d8", 4: "#f58231",
  5: "#911eb4", 6: "#42d4f4", 7: "#f032e6", 8: "#bfef45",
  9: "#469990", 10: "#dcbeff", 11: "#9a6324", 12: "#800000",
  13: "#aaffc3", 14: "#808000", 15: "#000075", 16: "#e6beff",
  17: "#555555", 18: "#ffffff"
};

const map = L.map("map", { center: [45.7, 6.4], zoom: 9 });

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

const cluster = L.markerClusterGroup({ showCoverageOnHover: false });
map.addLayer(cluster);

let markersById = {};
let currentFeatures = [];
let selectedId = null;
let massifMode = false;
let currentMassifId = null;
let fetchToken = 0;

const statusEl = document.getElementById("status");
const listEl = document.getElementById("point-list");
const countEl = document.getElementById("count");
const filterInput = document.getElementById("filter-text");
const ficheEl = document.getElementById("fiche-content");
const typeFiltersEl = document.getElementById("type-filters");
const massifSelect = document.getElementById("massif-select");
const btnZone = document.getElementById("btn-zone");

function typeColor(typeId) {
  return TYPE_COLORS[typeId] || "#1f4e3d";
}

function pointColor(feature) {
  const t = feature.properties.type;
  return typeColor(t && t.id);
}

function makeIcon(feature) {
  const color = pointColor(feature);
  const html = `<div class="marker-label" style="border-color:${color};color:${color}">${escapeHtml(feature.properties.nom || "")}</div>`;
  return L.divIcon({
    className: "",
    html: `<span class="dot" style="background:${color}"></span>${html}`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function currentBboxParam() {
  const b = map.getBounds();
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
    .map(v => v.toFixed(4)).join(",");
}

async function loadPoints() {
  const token = ++fetchToken;
  let url;
  if (massifMode && currentMassifId) {
    url = `${API}/massif?massif=${currentMassifId}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300`;
    setStatus("Chargement du massif...");
  } else {
    url = `${API}/bbox?bbox=${currentBboxParam()}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300`;
    setStatus("Chargement de la zone visible...");
  }

  let data;
  try {
    data = await apiFetch(url);
  } catch (e) {
    if (token === fetchToken) setStatus("Erreur de chargement : " + e.message);
    return;
  }
  if (token !== fetchToken) return;

  const features = (data.features || []).filter(activeTypeIds().size === 0 || (f => activeTypeIds().has(f.properties.type && f.properties.type.id)));
  applyFeatures(features, data.size);
}

function activeTypeIds() {
  const ids = new Set();
  typeFiltersEl.querySelectorAll("input:checked").forEach(cb => ids.add(Number(cb.value)));
  return ids;
}

function applyFeatures(features, totalSize) {
  currentFeatures = features;
  cluster.clearLayers();
  markersById = {};

  features.forEach(f => {
    const m = L.marker(f.geometry.coordinates.slice().reverse(), { icon: makeIcon(f) });
    m.on("click", () => selectPoint(f.id));
    cluster.addLayer(m);
    markersById[f.id] = m;
  });

  countEl.textContent = features.length;
  setStatus(`${features.length} point(s) affiché(s)` + (totalSize > features.length ? ` (sur ${totalSize})` : ""));
  renderList();
  buildTypeFilters();
}

function renderList() {
  const q = filterInput.value.trim().toLowerCase();
  listEl.innerHTML = "";
  currentFeatures
    .filter(f => !q || (f.properties.nom || "").toLowerCase().includes(q))
    .forEach(f => {
      const p = f.properties;
      const li = document.createElement("li");
      li.dataset.id = f.id;
      if (f.id === selectedId) li.classList.add("selected");
      const places = p.places && p.places.valeur != null ? ` · ${p.places.valeur} pl.` : "";
      const etat = p.etat && p.etat.valeur ? ` · ${p.etat.valeur}` : "";
      li.innerHTML = `<span class="dot" style="background:${pointColor(f)}"></span>
        <span><span class="name">${escapeHtml(p.nom || "(sans nom)")}</span><br>
        <span class="meta">${escapeHtml(p.type ? p.type.valeur : "")}${escapeHtml(places)}${escapeHtml(etat)}${p.coord && p.coord.alt ? " · " + p.coord.alt + " m" : ""}</span></span>`;
      li.addEventListener("click", () => selectPoint(f.id));
      listEl.appendChild(li);
    });
}

function buildTypeFilters() {
  const present = new Map();
  currentFeatures.forEach(f => {
    const t = f.properties.type;
    if (t && !present.has(t.id)) present.set(t.id, t.valeur);
  });
  typeFiltersEl.innerHTML = "";
  [...present.entries()].sort((a, b) => a[0] - b[0]).forEach(([id, label]) => {
    const labelEl = document.createElement("label");
    labelEl.innerHTML = `<input type="checkbox" value="${id}" checked> ${escapeHtml(label)}`;
    labelEl.querySelector("input").addEventListener("change", () => {
      loadPoints();
    });
    typeFiltersEl.appendChild(labelEl);
  });
}

async function selectPoint(id) {
  selectedId = id;
  document.getElementById("tab-fiche").click();
  ficheEl.innerHTML = '<p class="muted">Chargement de la fiche...</p>';
  renderList();

  let data;
  try {
    data = await apiFetch(`${API}/point?id=${id}&format=geojson&detail=fiche&format_texte=html`);
  } catch (e) {
    ficheEl.innerHTML = `<p class="muted">Erreur : ${escapeHtml(e.message)}</p>`;
    return;
  }
  const f = data.features && data.features[0];
  if (!f) { ficheEl.innerHTML = '<p class="muted">Point introuvable.</p>'; return; }
  renderFiche(f);

  const m = markersById[id];
  if (m && map.hasLayer(cluster)) {
    map.setView(m.getLatLng(), Math.max(map.getZoom(), 13));
  }
}

function renderFiche(f) {
  const p = f.properties;
  const color = pointColor(f);
  const rows = [];
  rows.push(`<span class="badge" style="background:${color}">${escapeHtml(p.type ? p.type.valeur : "")}</span>`);
  rows.push(`<h2>${escapeHtml(p.nom || "(sans nom)")}</h2>`);
  if (p.coord) {
    rows.push(`<p class="kv"><b>Altitude :</b> ${p.coord.alt != null ? p.coord.alt + " m" : "?"} · <b>Lat</b> ${p.coord.lat}, <b>Long</b> ${p.coord.long}</p>`);
  }
  if (p.etat && p.etat.valeur) rows.push(`<p class="kv"><b>État :</b> ${escapeHtml(p.etat.valeur)}</p>`);
  if (p.places && p.places.valeur != null) rows.push(`<p class="kv"><b>Places :</b> ${p.places.valeur}</p>`);
  if (p.proprio && p.proprio.valeur) rows.push(`<p class="kv"><b>${escapeHtml(p.proprio.nom)} :</b> ${escapeHtml(p.proprio.valeur)}</p>`);
  if (p.acces && p.acces.valeur) rows.push(`<h3>Accès</h3><div class="text">${escapeHtml(p.acces.valeur)}</div>`);
  if (p.remarque && p.remarque.valeur) rows.push(`<h3>Remarques</h3><div class="text">${escapeHtml(p.remarque.valeur)}</div>`);
  if (p.info_comp) {
    const items = Object.values(p.info_comp).filter(i => i && i.valeur != null && i.valeur !== "");
    if (items.length) {
      rows.push("<h3>Équipements</h3>");
      items.forEach(i => rows.push(`<p class="kv"><b>${escapeHtml(i.nom)} :</b> ${escapeHtml(String(i.valeur))}</p>`));
    }
  }
  if (p.date) {
    rows.push(`<h3>Dates</h3><p class="kv">Création : ${escapeHtml(p.date.creation || "?")} · Modifié : ${escapeHtml(p.date.derniere_modif || "?")}</p>`);
  }
  if (p.lien) rows.push(`<p><a href="${escapeHtml(p.lien)}" target="_blank" rel="noopener">Fiche complète sur refuges.info &#8599;</a></p>`);
  if (f.comments && f.comments.length) {
    rows.push("<h3>Commentaires</h3>");
    f.comments.forEach(c => {
      rows.push(`<div class="comment"><div class="c-head">${escapeHtml(c.date || "")} — ${escapeHtml(c.auteur || "?")}</div><div class="text">${escapeHtml(c.texte || "")}</div></div>`);
    });
  }
  ficheEl.innerHTML = rows.join("");
}

async function loadMassifs() {
  try {
    const data = await apiFetch(`${API}/polygones?type_polygone=1&format=geojson&bbox=world`);
    (data.features || []).forEach(feat => {
      const nom = feat.properties && (feat.properties.nom || feat.properties.name);
      if (!nom) return;
      const opt = document.createElement("option");
      opt.value = feat.id;
      opt.textContent = nom;
      massifSelect.appendChild(opt);
    });
  } catch (e) {
    setStatus("Impossible de charger la liste des massifs");
  }
}

massifSelect.addEventListener("change", () => {
  if (massifSelect.value) {
    massifMode = true;
    currentMassifId = massifSelect.value;
    btnZone.classList.remove("active");
    loadPoints();
  }
});

btnZone.addEventListener("click", () => {
  massifMode = false;
  currentMassifId = null;
  massifSelect.value = "";
  btnZone.classList.add("active");
  loadPoints();
});

let moveTimer = null;
map.on("moveend", () => {
  clearTimeout(moveTimer);
  moveTimer = setTimeout(() => { if (!massifMode) loadPoints(); }, 400);
});

filterInput.addEventListener("input", renderList);

document.getElementById("tab-liste").addEventListener("click", () => switchTab("liste"));
document.getElementById("tab-fiche").addEventListener("click", () => switchTab("fiche"));

function switchTab(which) {
  document.getElementById("tab-liste").classList.toggle("active", which === "liste");
  document.getElementById("tab-fiche").classList.toggle("active", which === "fiche");
  document.getElementById("panel-liste").classList.toggle("active", which === "liste");
  document.getElementById("panel-fiche").classList.toggle("active", which === "fiche");
}

loadMassifs();
loadPoints();