# Explorateur Refuges.info

Site web statique en HTML/JS vanilla qui interroge l'[API publique de refuges.info](https://www.refuges.info/api/doc/) (lecture seule, sans clé).

## Fonctionnalités

- Carte Leaflet avec chargement dynamique des points via `GET /api/bbox` (zone = ce qui est visible à l'écran, rechargé à chaque déplacement)
- Recherche par massif via `GET /api/polygones` (liste des massifs) puis `GET /api/massif`
- Filtres par type de point (refuge gardé, cabane non gardée, point d'eau...)
- Liste filtrable par nom, fiche détaillée d'un point via `GET /api/point?id=...&detail=fiche`
- Clustering des marqueurs, labels colorés par type

## Lancer en local

Aucune étape de build : servir le dossier avec n'importe quel serveur statique, par ex. :

```bash
python3 -m http.server 8000