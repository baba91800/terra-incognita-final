# TERRA INCOGNITA — CHANGELOG DES CORRECTIONS

## Fichiers modifiés

| Fichier | Fixes appliqués |
|---------|----------------|
| `src/App.tsx` | #4 handleReset branché, #5 onOpenProfile dupliqué supprimé |
| `src/main.tsx` | #19 Service Worker enregistré |
| `src/hooks/useGameEngine.ts` | #6 GPS erreur lisible, #8 explorationPercent corrigé, #9 User-Agent Nominatim, #13 prevPos supprimé, #14 streak fiable, #17 quota localStorage |
| `src/components/MapView.tsx` | #11 memory leak cleanup, #12 closure stale monuments (monumentsRef) |
| `src/components/ProfileScreen.tsx` | #4 bouton reset dans l'UI, prop onReset ajouté |
| `src/components/ScaleBar.tsx` | #18 antipattern ref.current en dépendance useEffect |
| `src/components/MiniMap.tsx` | #15 commentaire clarificateur sur tiles.size |
| `src/components/Onboarding.tsx` | #23 étoiles stabilisées avec useMemo |
| `src/lib/overpass.ts` | #7 fallback 3 endpoints, #16 verrou async par zone |
| `src/lib/territory.ts` | #9 User-Agent Nominatim, #10 throttle ~200m |
| `tsconfig.json` | #20 strict: true activé |
| `public/sw.js` | #19 Service Worker offline (tuiles + assets) |

---

## Détail de chaque fix

### #4 — handleReset inaccessible
- **Avant :** `handleReset` défini dans App.tsx mais aucun bouton n'y était branché
- **Après :** Passé en prop `onReset` à `ProfileScreen`, bouton "Réinitialiser toutes les données" en bas de l'onglet Profil

### #5 — onOpenProfile dupliqué dans HUD
- **Avant :** prop passée deux fois dans `<HUD>`
- **Après :** une seule occurrence

### #6 — GPS erreur silencieuse
- **Avant :** `() => setGpsActive(false)` — l'utilisateur ne sait pas pourquoi le GPS s'arrête
- **Après :** 3 cas gérés (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT) avec messages FR, exposés via `gpsError` dans le retour du hook

### #7 — Overpass API single point of failure
- **Avant :** 1 seul endpoint `overpass.kumi.systems`
- **Après :** 3 endpoints en fallback séquentiel avec timeout 15s par endpoint

### #8 — explorationPercent mal calculé
- **Avant :** `tiles.size / 100` → 100% = 100 tuiles = 10 000 m² (trop peu)
- **Après :** `(tiles.size / 10000) * 100` → 100% = 10 000 tuiles = 1 km² (plus réaliste)

### #9 — Nominatim sans User-Agent
- **Avant :** requêtes sans header `User-Agent` (violation de la politique d'usage)
- **Après :** `User-Agent: TerraIncognita/0.1 (https://terra-incognita-final.vercel.app)` ajouté dans `detectCountry()` et `fetchTerritory()`

### #10 — fetchTerritory trop fréquent
- **Avant :** grille `lat.toFixed(2)` = ~1km — appelé trop souvent en ville
- **Après :** grille `0.002°` (~200m) + debounce 2s — beaucoup moins de requêtes

### #11 — Memory leak MapView
- **Avant :** au démontage du composant, les markers Leaflet (personnels + monuments + joueur) n'étaient pas supprimés
- **Après :** cleanup complet dans le return du useEffect d'init : `.remove()` sur tous les markers + `.clear()` des Maps

### #12 — Closure stale monuments dans les listeners Leaflet
- **Avant :** `map.on('click', ...)` capturait `monuments` de la closure initiale (toujours vide)
- **Après :** `monumentsRef.current` mis à jour à chaque render via `useEffect` dédié — le listener lit toujours la liste à jour

### #13 — prevPos mort dans useHeading
- **Avant :** `const prevPos = useRef<...>(null)` déclaré mais jamais utilisé
- **Après :** supprimé

### #14 — Streak calculé dans checkBadges
- **Avant :** logique streak dans `checkBadges()` appelé à chaque tuile → risque de rate, calcul dupliqué
- **Après :** `updateStreak()` appelé une seule fois au démarrage dans `useEffect`

### #15 — MiniMap dépendance Set
- **Avant :** `tiles.size` comme dépendance, commentaire absent
- **Après :** commentaire explicite confirmant que `tiles.size` est le bon signal (Set stable par référence)

### #16 — Race condition Overpass
- **Avant :** si le joueur se déplace vite, plusieurs fetches pour la même zone pouvaient partir simultanément
- **Après :** `pendingFetches` Set qui bloque les doublons + `try/finally` pour libérer le verrou

### #17 — localStorage quota tiles
- **Avant :** sauvegarde à chaque tuile, sans limite — risque de dépasser les 5-10 MB
- **Après :** `MAX_TILES_STORED = 50_000` (~5 km²) + sauvegarde throttlée au-delà

### #18 — ScaleBar ref.current comme dépendance useEffect
- **Avant :** `useEffect(() => {...}, [mapRef.current])` — antipattern React, ne se déclenche pas au changement
- **Après :** polling léger (100ms, max 3s) pour détecter quand la carte est disponible, puis attachement des listeners

### #19 — Pas de support offline
- **Avant :** pas de Service Worker
- **Après :** `public/sw.js` avec cache-first pour les tuiles CartoCDN et les assets statiques, network-first pour Overpass/Nominatim. Enregistrement dans `main.tsx`.

### #20 — TypeScript strict: false
- **Avant :** `"strict": false` — les erreurs de type les plus courantes non détectées
- **Après :** `"strict": true` + `noUnusedLocals` + `noUnusedParameters`

### #22 — DEFAULT_MONUMENTS hardcodés Paris
- Non modifié (comportement voulu pour la démo parisienne). À noter pour les futures versions.

### #23 — Onboarding étoiles recalculées
- **Avant :** `Math.random()` appelé à chaque render dans le JSX
- **Après :** `useMemo(() => [...], [])` — positions calculées une seule fois
