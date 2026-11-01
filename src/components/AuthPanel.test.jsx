import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthPanel from "./AuthPanel";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AuthPanel", () => {
  it("sans config cloud, affiche un message 'non configuré' (mode local)", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    render(<AuthPanel user={null} busy={false} error="" onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} />);
    expect(screen.getByText(/non configuré/i)).toBeInTheDocument();
  });

  it("avec config, le formulaire appelle onLogin(email, password)", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "k");
    const onLogin = vi.fn().mockResolvedValue({});
    render(<AuthPanel user={null} busy={false} error="" onLogin={onLogin} onSignup={() => {}} onLogout={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), { target: { value: "secret" } });
    fireEvent.click(screen.getByText("Connexion"));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith("a@b.c", "secret"));
  });

  it("le bouton 'Créer un compte' appelle onSignup", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "k");
    const onSignup = vi.fn().mockResolvedValue({});
    render(<AuthPanel user={null} busy={false} error="" onLogin={() => {}} onSignup={onSignup} onLogout={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), { target: { value: "secret" } });
    fireEvent.click(screen.getByText("Créer un compte"));
    await waitFor(() => expect(onSignup).toHaveBeenCalledWith("a@b.c", "secret"));
  });

  it("connecté : affiche l'email et le bouton déconnexion appelle onLogout", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "k");
    const onLogout = vi.fn();
    render(
      <AuthPanel user={{ id: "u1", email: "a@b.c" }} busy={false} error="" onLogin={() => {}} onSignup={() => {}} onLogout={onLogout} />
    );
    expect(screen.getByText("a@b.c")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Se déconnecter"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("affiche les deux boutons 'Connexion' ET 'Créer un compte' bien visibles", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "k");
    render(<AuthPanel user={null} busy={false} error="" onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} />);
    expect(screen.getByText("Connexion")).toBeVisible();
    expect(screen.getByText("Créer un compte")).toBeVisible();
  });

  it("affiche l'erreur renvoyée", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "k");
    render(<AuthPanel user={null} busy={false} error="Invalid login credentials" onLogin={() => {}} onSignup={() => {}} onLogout={() => {}} />);
    expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
  });
});
