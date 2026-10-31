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

  it("propage le message d'erreur du serveur", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ message: "Invalid login credentials" }) })));
    await expect(auth.login("a@b.c", "x")).rejects.toThrow("Invalid login credentials");
  });
});
