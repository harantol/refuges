# Explorateur Refuges.info

Site web en **React (Vite)** qui interroge l'[API publique de refuges.info](https://www.refuges.info/api/doc/) (lecture seule, sans clé).

## Fonctionnalités

- Carte Leaflet (react-leaflet) avec chargement dynamique des points via `GET /api/bbox` (zone = ce qui est visible à l'écran, rechargé à chaque déplacement)
- Recherche par massif via `GET /api/polygones` (liste des massifs) puis `GET /api/massif`
- Filtres par type de point (état conservé entre les rechargements)
- Liste filtrable par nom, fiche détaillée d'un point via `GET /api/point?id=...&detail=fiche`
- Clustering des marqueurs, labels colorés par type

## Lancer en local

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```
