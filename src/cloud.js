// Synchro cloud des favoris via Supabase (REST pur, pas de SDK).
// Config : VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (clé publique anon, par design)
// ou localStorage "supabase-url" / "supabase-anon-key". Sans config -> mode local seul.
// Schéma SQL à appliquer dans Supabase (voir README) :
//   create table favoris (user_id uuid references auth.users not null, point_id int not null,
//                         primary key (user_id, point_id));
//   alter table favoris enable row level security;
//   create policy "own" on favoris for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

// Normalise l'URL du projet (trim + sans slash final, sinon Supabase renvoie
// "Invalid path specified in request URL" à cause du double slash)
const cleanUrl = (u) => (u || "").trim().replace(/\/+$/, "");

const cfg = () => ({
  url: cleanUrl(
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("supabase-url")) ||
      ""
  ),
  key:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("supabase-anon-key")) ||
    "",
});

export const cloudConfigured = () => Boolean(cfg().url && cfg().key);

const TOKEN_KEY = "cloud-auth-token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stockage indisponible */
  }
}

async function req(path, { method = "GET", body, auth = false } = {}) {
  const { url, key } = cfg();
  if (!url || !key) throw new Error("Cloud non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  const headers = { apikey: key, "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Lire le texte d'abord : Supabase renvoie 201/204 avec un body VIDE sur les
  // écritures sans "Prefer: return=representation" -> res.json() planterait
  // ("unexpected end of data")
  const text = await res.text();
  if (!res.ok) {
    let msg = "HTTP " + res.status;
    try {
      const j = JSON.parse(text);
      msg = j.message || j.error_description || j.msg || msg;
    } catch {
      /* body non JSON */
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

export const auth = {
  signup: (email, password) =>
    req("/auth/v1/signup", { method: "POST", body: { email, password } }),

  login: async (email, password) => {
    const r = await req("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    setToken(r.access_token);
    return r.user;
  },

  // Renvoie l'utilisateur courant si un token valide est stocké, sinon null
  me: async () => {
    if (!getToken()) return null;
    try {
      return await req("/auth/v1/user", { auth: true });
    } catch {
      setToken(null);
      return null;
    }
  },

  logout: async () => {
    try {
      await req("/auth/v1/logout", { method: "POST", auth: true });
    } catch {
      /* token déjà invalide */
    }
    setToken(null);
  },
};

export const favorisCloud = {
  list: async (userId) => {
    const rows = await req(`/rest/v1/favoris?select=point_id&user_id=eq.${userId}`, { auth: true });
    return (rows || []).map((r) => Number(r.point_id));
  },
  add: (userId, pointId) =>
    req("/rest/v1/favoris", {
      method: "POST",
      auth: true,
      body: { user_id: userId, point_id: pointId },
    }),
  remove: (userId, pointId) =>
    req(`/rest/v1/favoris?user_id=eq.${userId}&point_id=eq.${pointId}`, {
      method: "DELETE",
      auth: true,
    }),
};
