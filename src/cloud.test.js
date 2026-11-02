import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { auth, favorisCloud, cloudConfigured, getToken } from "./cloud";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key-123");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, opts = {}) => {
      const u = String(url);
      const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
      if (u.includes("/auth/v1/token"))
        return json({ access_token: "tok-abc", user: { id: "u1", email: "a@b.c" } });
      if (u.includes("/auth/v1/user")) return json({ id: "u1", email: "a@b.c" });
      if (u.includes("/auth/v1/signup")) return json({});
      if (u.includes("/auth/v1/logout")) return { ok: true, status: 204, json: async () => null };
      if (u.includes("/rest/v1/favoris") && (opts.method === "DELETE"))
        return { ok: true, status: 204, json: async () => null };
      if (u.includes("/rest/v1/favoris") && opts.method === "POST") return json({}, 201);
      if (u.includes("/rest/v1/favoris")) return json([{ point_id: 42 }, { point_id: 7 }]);
      return json({ message: "not found" }, 404);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("cloud (Supabase REST)", () => {
  it("cloudConfigured avec les env VITE_SUPABASE_*", () => {
    expect(cloudConfigured()).toBe(true);
  });

  it("login stocke le token et envoie apikey + email/password", async () => {
    const u = await auth.login("a@b.c", "secret");
    expect(u).toEqual({ id: "u1", email: "a@b.c" });
    expect(getToken()).toBe("tok-abc");
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain("https://test.supabase.co/auth/v1/token?grant_type=password");
    expect(opts.headers.apikey).toBe("anon-key-123");
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.c", password: "secret" });
  });

  it("me() sans token renvoie null sans appeler l'API", async () => {
    expect(await auth.me()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("me() avec token envoie Authorization: Bearer", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    const u = await auth.me();
    expect(u.email).toBe("a@b.c");
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Bearer tok-abc");
  });

  it("me() conserve le token si la vérification échoue pour une raison réseau", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));

    await expect(auth.me()).rejects.toThrow("offline");
    expect(getToken()).toBe("tok-abc");
  });

  it("me() efface le token si Supabase le refuse", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid token" }),
      }))
    );

    await expect(auth.me()).resolves.toBeNull();
    expect(getToken()).toBeNull();
  });

  it("me() renouvelle un token expiré et conserve le nouveau refresh token", async () => {
    localStorage.setItem("cloud-auth-token", "expired");
    localStorage.setItem("cloud-auth-refresh-token", "refresh-old");
    let userRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.includes("grant_type=refresh_token")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: "access-new",
              refresh_token: "refresh-new",
            }),
          };
        }
        userRequests += 1;
        if (userRequests === 1) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ message: "Expired token" }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "u1", email: "a@b.c" }),
        };
      })
    );

    await expect(auth.me()).resolves.toEqual({ id: "u1", email: "a@b.c" });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(getToken()).toBe("access-new");
    expect(localStorage.getItem("cloud-auth-refresh-token")).toBe("refresh-new");
  });

  it("me() efface les tokens si le refresh token est invalide", async () => {
    localStorage.setItem("cloud-auth-token", "expired");
    localStorage.setItem("cloud-auth-refresh-token", "invalid-refresh");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => ({
        ok: false,
        status: url.includes("grant_type=refresh_token") ? 400 : 401,
        json: async () => ({ message: "Invalid token" }),
      }))
    );

    await expect(auth.me()).resolves.toBeNull();
    expect(getToken()).toBeNull();
    expect(localStorage.getItem("cloud-auth-refresh-token")).toBeNull();
  });

  it("favorisCloud.list parse les point_id et filtre par user", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    const ids = await favorisCloud.list("u1");
    expect(ids).toEqual([42, 7]);
    expect(fetch.mock.calls[0][0]).toContain("user_id=eq.u1");
  });

  it("favorisCloud.add fait un POST avec user_id + point_id", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    await favorisCloud.add("u1", 583);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain("/rest/v1/favoris");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ user_id: "u1", point_id: 583 });
  });

  it("favorisCloud.remove fait un DELETE filtré", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    await favorisCloud.remove("u1", 583);
    const [url, opts] = fetch.mock.calls[0];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain("user_id=eq.u1");
    expect(url).toContain("point_id=eq.583");
  });

  it("logout vide le token", async () => {
    localStorage.setItem("cloud-auth-token", "tok-abc");
    await auth.logout();
    expect(getToken()).toBeNull();
  });

  it("normalise l'URL (slash final retiré, pas de double slash dans le path)", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co/");
    await auth.login("a@b.c", "secret");
    expect(fetch.mock.calls[0][0]).toBe("https://test.supabase.co/auth/v1/token?grant_type=password");
    expect(fetch.mock.calls[0][0]).not.toContain("//auth");
  });

  it("gère un body vide (201/204) sans planter sur res.json()", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 201, text: async () => "" }))
    );
    localStorage.setItem("cloud-auth-token", "tok");
    await expect(favorisCloud.add("u1", 22)).resolves.toBeNull();
  });

  it("propage le message d'erreur du serveur", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ message: "Invalid login credentials" }) })));
    await expect(auth.login("a@b.c", "x")).rejects.toThrow("Invalid login credentials");
  });
});
