# Explorateur Refuges.info

Site web en **React 18 + Vite + react-leaflet** qui interroge l'[API publique de refuges.info](https://www.refuges.info/api/doc/) (lecture seule, sans clé).

## Fonctionnalités

- Carte Leaflet avec chargement dynamique des points via `GET /api/bbox` (zone visible à l'écran, rechargée à chaque déplacement) ou `GET /api/massif`
- Clustering des marqueurs, labels colorés par type de point
- Filtres par type (l'état des cases est conservé entre les rechargements)
- Liste filtrable par nom + **recherche par nom dans toute la base** (`bbox=world&detail=icone&nb_points=all`, ~1,6 Mo mis en cache sessionStorage)
- **Recherche de massif par autocomplétion** (`GET /api/polygones?type_polygone=1`)
- Fiche détaillée d'un point via `GET /api/point?id=...&detail=fiche` (accès, remarques, équipements, commentaires)
- **4 fonds de carte** : OSM, OpenTopoMap, satellite Esri, OSM France HOT
- **📍 Autour de moi** : géolocalisation, marqueur "vous êtes ici", distances (haversine) dans la liste et la fiche
- **★ Favoris** persistés en localStorage, onglet dédié chargé via `GET /api/point?id=1,2,3`
- **Filtre "modifié depuis X jours"** via le paramètre `depuis` de l'API

## Lancer en local

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

## Licence des données

Données refuges.info : CC BY-SA 2.0 · Carte : © OpenStreetMap (ODbL) et fonds Esri/OpenTopoMap selon leurs licences respectives.
