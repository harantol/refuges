import { useState } from "react";

// Formulaire de saisie d'une clé API IGN perso (optionnel : la clé partagée
// ign_scan_ws est utilisée par défaut pour la Top 25).
export default function IgnKeyForm({ onIgnKeySave }) {
  const [ignKey, setIgnKey] = useState("");
  return (
    <span
      className="ign-key-form"
      title="Par défaut, la clé partagée ign_scan_ws est utilisée. Collez ici votre clé perso (geoservices.ign.fr) pour un quota dédié."
    >
      <input
        id="ign-key-input"
        type="password"
        placeholder="Clé perso IGN (optionnel)…"
        value={ignKey}
        onChange={(e) => setIgnKey(e.target.value)}
      />
      <button
        id="ign-key-save"
        disabled={!ignKey.trim()}
        onClick={() => onIgnKeySave?.(ignKey.trim())}
      >
        Enregistrer
      </button>
    </span>
  );
}
