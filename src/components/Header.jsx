import AuthPanel from "./AuthPanel";
import { IconUser } from "./icons";

export default function Header({
  massifs,
  massifQuery,
  onMassifQueryChange,
  onZoneClick,
  zoneActive,
  recentDays,
  onRecentChange,
  status,
  user,
  accountOpen,
  onAccountToggle,
  authBusy,
  authError,
  onLogin,
  onSignup,
  onLogout,
}) {
  return (
    <header id="topbar">
      <h1>⛺ Explorateur Refuges.info</h1>
      <div className="controls">
        <div className="massif-row">
          <input
            id="massif-search"
            type="search"
            list="massifs-list"
            placeholder="Rechercher un massif…"
            value={massifQuery}
            onChange={(e) => onMassifQueryChange(e.target.value)}
            title="Rechercher par massif (autocomplétion)"
          />        </div>
        <datalist id="massifs-list">
          {massifs.map((m) => (
            <option key={m.id} value={m.nom} />
          ))}
        </datalist>
        <button id="btn-zone" className={zoneActive ? "active" : ""} onClick={onZoneClick} title="Revenir à la zone visible sur la carte">
          Zone visible
        </button>
        {/* fond de carte + pentes + clé IGN : dans le menu flottant 🗺️ sur la carte (MapControls) */}
        <select
          id="recent-select"
          value={recentDays}
          onChange={(e) => onRecentChange(Number(e.target.value))}
          title="Ne garder que les points modifiés récemment (paramètre depuis de l'API)"
        >
          <option value={0}>Toutes les dates</option>
          <option value={7}>Modifié depuis 7 j</option>
          <option value={30}>Modifié depuis 30 j</option>
          <option value={90}>Modifié depuis 90 j</option>
          <option value={365}>Modifié depuis 1 an</option>
        </select>
        <span id="status">{status}</span>

        <div className="account-wrap">
            <button
              id="btn-account"
              className={accountOpen ? "active" : ""}
              title={user ? `Connecté : ${user.email} — cliquez pour vous déconnecter` : "Connexion / compte (synchronise vos favoris)"}
              aria-label="Compte"
              onClick={onAccountToggle}
            >
              <IconUser size={20} />
            </button>
            {accountOpen && (
              <div className="account-dropdown">
                <AuthPanel
                  user={user}
                  busy={authBusy}
                  error={authError}
                  onLogin={onLogin}
                  onSignup={onSignup}
                  onLogout={onLogout}
                />
              </div>
            )}
          </div>
      </div>
    </header>
  );
}
