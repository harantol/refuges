import { useState } from "react";
import { cloudConfigured } from "../cloud";

// Panneau compte : connexion / création de compte (Supabase, auth email+mot de passe).
// Si le cloud n'est pas configuré, on reste en mode local (localStorage).
export default function AuthPanel({ user, busy, error, onLogin, onSignup, onLogout }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (user) {
    return (
      <div className="auth-panel">
        <p className="auth-user">👤 <b>{user.email}</b></p>
        <p className="muted small">Vos favoris sont synchronisés sur tous vos appareils.</p>
        <button className="auth-btn" onClick={onLogout} disabled={busy}>
          Se déconnecter
        </button>
      </div>
    );
  }

  if (!cloudConfigured()) {
    return (
      <div className="auth-panel">
        <p className="muted small">
          Compte cloud non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
          Les favoris restent stockés localement (localStorage).
        </p>
      </div>
    );
  }

  const submit = async (mode) => {
    setErr("");
    try {
      if (mode === "login") await onLogin(email.trim(), password);
      else await onSignup(email.trim(), password);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth-panel">
      <p className="map-menu-title">Compte (sync des favoris)</p>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {(err || error) && <p className="auth-error">{err || error}</p>}
      <div className="auth-actions">
        <button className="auth-btn primary" disabled={busy || !email || !password} onClick={() => submit("login")}>
          Connexion
        </button>
        <button className="auth-btn" disabled={busy || !email || !password} onClick={() => submit("signup")}>
          Créer un compte
        </button>
      </div>
    </div>
  );
}
