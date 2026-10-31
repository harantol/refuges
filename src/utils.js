export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Formate une date en JJ/MM/AAAA. Accepte "2026-03-31", un timestamp unix (s ou ms).
export function formatDateFr(v) {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const n = Number(s);
  if (Number.isFinite(n) && n > 100_000_000) {
    const ms = n > 1e12 ? n : n * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      const jj = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${jj}/${mm}/${d.getFullYear()}`;
    }
  }
  return s;
}

// Date d'un commentaire refuges.info : champ date/date_photo, sinon timestamp
// embarqué dans l'URL de la photo (/photos_points/xxx.jpeg?1793461591).
export function commentDate(c) {
  if (!c) return "";
  if (c.date_photo) return formatDateFr(c.date_photo);
  if (c.date) return formatDateFr(c.date);
  const m = /[?&](\d{9,})(?:$|[^\d])/.exec(c.photo || "");
  if (m) return formatDateFr(Number(m[1]));
  return "";
}
