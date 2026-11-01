# Explorateur Refuges.info

Site web en **React 18 + Vite + react-leaflet** qui interroge l'[API publique de refuges.info](https://www.refuges.info/api/doc/) (lecture seule, sans clé).

## Fonctionnalités

- Carte Leaflet avec chargement dynamique via `GET /api/bbox` (zone visible) ou `GET /api/massif`, clustering des marqueurs
- **Icônes officielles refuges.info** par type de point (`type.icone` de l'API, servies depuis `/images/icones/`), pastille colorée en fallback — sur la carte, la liste et la fiche
- **Filtres par type** : liste toujours exhaustive (tous les types connus de l'API), compteurs par zone, état conservé entre les rechargements
- **🔎 Recherche détaillée** dans toute la base : nom, types, altitude min/max, places min, état, et **tous les équipements** (cheminée, poêle, eau, bois, couvertures, latrines, manque un mur — Oui/Non/Indifférent). Base `simple` (3,8 Mo, cache sessionStorage) + base `complet` (~20 Mo, chargée une seule fois en mémoire) pour les équipements
- Fiche détaillée (`/api/point?id=...&detail=fiche`) : infos clés + équipements en pastilles en premier, accès/remarques en HTML sanitizé (DOMPurify), **galerie photos avec diaporama (lightbox)** + légendes (commentaire, auteur, date), commentaires datés, lien vers la fiche refuges.info
- **Fonds de carte** : OpenTopoMap (défaut), OSM, OSM France HOT, satellite Esri, **IGN Plan v2** et **IGN BDUNI J1** (officiels, open data, sans clé via data.geopf.fr), **IGN Top 25** (avec clé API Géoplateforme, saisie dans l'UI)
- **Case « Pentes »** : couche officielle **IGN SLOPES.MOUNTAIN** (open data, sans clé) en overlay
- **📍 Autour de moi** : géolocalisation + distances (haversine) dans la liste et la fiche
- **★ Favoris** persistés en localStorage, onglet dédié (un appel `/api/point` par favori — l'API ne prend qu'un seul id)
- **Filtre "modifié depuis X jours"** via le paramètre `depuis` de l'API
- **Responsive smartphone** (≤ 800 px) : panneau latéral coulissant par-dessus la carte, cibles tactiles ≥ 40 px
- Recherche de massif par autocomplétion (`GET /api/polygones?type_polygone=1`)
- Favicon SVG personnalisé

## Comptes & synchro cloud des favoris (Supabase)

Les favoris sont d'abord en `localStorage` ; avec un **compte**, ils sont synchronisés
via Supabase (REST pur, auth email + mot de passe). Bouton 👤 dans le header (desktop)
ou dans les contrôles flottants (mobile).

1. Créez un projet gratuit sur [supabase.com](https://supabase.com), activez l'email auth
2. Dans l'éditeur SQL, créez/recréez la table (avec `drop` pour repartir propre) :
```sql
drop table if exists favoris;
create table favoris (
  user_id uuid references auth.users not null,
  point_id int not null,
  primary key (user_id, point_id)
);
alter table favoris enable row level security;
create policy "own" on favoris for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- indispensable sinon 42501 'permission denied for table favoris' :
grant select, insert, update, delete on favoris to anon;
-- indispensable aussi pour les utilisateurs CONNECTÉS (rôle 'authenticated') :
grant select, insert, update, delete on public.favoris to authenticated;
```
> ⚠️ Vérifié en réel : sans `drop`, erreur `column favoris.point_id does not exist` (400) ;
> sans `GRANT … TO anon` → 42501 pour les requêtes anonymes ; sans `GRANT … TO authenticated` → 42501 **pour les utilisateurs connectés** (leur rôle est `authenticated`, pas `anon`).
3. Configurez le front (clé **anon publique**, par design) — valeurs dans Supabase :
   *Settings → API → Project URL* et *anon public key*.

   **En local** : copiez `.env.example` en `.env` et remplissez :
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   puis `npm run dev` (redémarrer le serveur après modification). `.env` est gitignoré.

   **Sur GitHub Pages (prod)** : les `VITE_*` sont embarquées au **build**, donc ajoutez-les
   dans *Settings → Secrets and variables → Actions → Variables* du dépôt
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, et `VITE_IGN_API_KEY` pour la Top 25) —
   le workflow `deploy.yml` les passe à `npm run build`. Redéploiement auto au prochain push sur `main`.

   Sans config, l'app fonctionne en mode local (localStorage seul). En secours runtime :
   `localStorage["supabase-url"]` / `["supabase-anon-key"]` dans la console du navigateur.

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

## Design

Thème inspiré de **Google Maps light** (voir `src/styles.css`, variables `--gm-*`) :
Roboto, header blanc avec ombre, panneau latéral en carte flottante (radius 12 px),
contrôles carte en boutons ronds blancs, onglets actifs en bleu `#1a73e8`,
icônes SVG outline dans les contrôles carte (`src/components/icons.jsx`),
icônes officielles refuges.info dans le menu filtres et sur la carte.
L'API Google Maps n'est pas utilisée (payante, tuiles verrouillées) : on reprend
son design system avec les tuiles OSM / OpenTopoMap / IGN (open data).
