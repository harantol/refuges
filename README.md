# Explorateur Refuges.info

Site web en **React 18 + Vite + react-leaflet** qui interroge l'[API publique de refuges.info](https://www.refuges.info/api/doc/) (lecture seule, sans clé).

## Fonctionnalités

- Carte Leaflet avec chargement dynamique via `GET /api/bbox` (zone visible) ou `GET /api/massif`, clustering des marqueurs
- **Icônes officielles refuges.info** par type de point (`type.icone` de l'API, servies depuis `/images/icones/`), pastille colorée en fallback — sur la carte, la liste et la fiche
- **Filtres par type** : liste toujours exhaustive (tous les types connus de l'API), compteurs par zone, état conservé entre les rechargements
- **🔎 Recherche détaillée** dans toute la base : nom, types, altitude min/max, places min, état, et **tous les équipements** (cheminée, poêle, eau, bois, couvertures, latrines, manque un mur — Oui/Non/Indifférent). Base `simple` (3,8 Mo, cache sessionStorage) + base `complet` (~20 Mo, chargée une seule fois en mémoire) pour les équipements
- Fiche détaillée (`/api/point?id=...&detail=fiche`) : infos clés + équipements en pastilles en premier, accès/remarques en HTML sanitizé (DOMPurify), **galerie photos avec diaporama (lightbox)** + légendes (commentaire, auteur, date), commentaires datés, lien vers la fiche refuges.info
- **4 fonds de carte** : OSM, OpenTopoMap, satellite Esri, OSM France HOT
- **📍 Autour de moi** : géolocalisation + distances (haversine) dans la liste et la fiche
- **★ Favoris** persistés en localStorage, onglet dédié (un appel `/api/point` par favori — l'API ne prend qu'un seul id)
- **Filtre "modifié depuis X jours"** via le paramètre `depuis` de l'API
- **Responsive smartphone** (≤ 800 px) : panneau latéral coulissant par-dessus la carte, cibles tactiles ≥ 40 px
- Recherche de massif par autocomplétion (`GET /api/polygones?type_polygone=1`)
- Favicon SVG personnalisé

## Tests & CI

- `npm test` : **95 tests** (Vitest + jsdom + Testing Library) — unitaires (api, geo, utils, types), composants (Header, Sidebar, PointList, Fiche, SearchPanel, TypeFilters, SafeHtml, Lightbox) et intégration App (fetch mocké)
- CI GitHub Actions (`.github/workflows/ci.yml`) : `npm ci` → `npm test` → `npm run build` → artifact `dist/`
- Déploiement auto sur GitHub Pages (`.github/workflows/deploy.yml`) à chaque push sur `main` → https://harantol.github.io/refuges/

## Lancer en local

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
npm test         # lancer les tests
```

## Licence des données

Données refuges.info : CC BY-SA 2.0 · Icônes : © contributeurs refuges.info · Carte : © OpenStreetMap (ODbL) et fonds Esri/OpenTopoMap selon leurs licences respectives.
