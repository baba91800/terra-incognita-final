# Terra Incognita 🗺️

> Transformez vos déplacements réels en jeu d'exploration avec Fog of War, badges et monuments.

## Stack
- **Next.js 14** + **TypeScript**
- **React Leaflet** + **OpenStreetMap / CartoDB Dark**
- **Canvas API** pour le Fog of War
- **localStorage** pour la persistance
- **Tailwind CSS** pour le style

---

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes

```bash
# 1. Cloner / dézipper le projet
cd terra-incognita

# 2. Installer les dépendances
npm install

# 3. Lancer en développement
npm run dev
```

Ouvrir **http://localhost:3000**

---

## Fonctionnalités

| Feature | Description |
|---|---|
| 🌫️ Fog of War | Canvas overlay — le monde est noir, révélé à l'exploration |
| 🗺️ Carte dark | CartoDB Dark + OSM, style immersif |
| 📍 GPS réel | `watchPosition()` — révèle automatiquement en marchant |
| 🎮 Simulation | Boutons N/S/E/W + touches flèches clavier |
| 🏛️ Monuments | 12 sites parisiens, raretés Common → Legendary |
| 🏅 Badges | 10 badges déblocables |
| 💾 Persistance | localStorage — sauvegarde automatique |
| 📱 Responsive | Desktop + mobile |

## Contrôles

- **Flèches clavier** : déplacer le joueur (10m par pression)
- **Boutons directionnel** : même effet sur mobile
- **GPS** : activer pour utilisation réelle en extérieur
- **🏅 / 🏛️** : ouvrir panneaux badges / monuments

## Monuments Paris (préchargés)

| Monument | Rareté | Points |
|---|---|---|
| Tour Eiffel | ⭐ LEGENDARY | 1000 |
| Musée du Louvre | ⭐ LEGENDARY | 1000 |
| Arc de Triomphe | 💎 EPIC | 300 |
| Cathédrale Notre-Dame | 💎 EPIC | 300 |
| Sacré-Cœur | 💎 EPIC | 300 |
| Musée d'Orsay | 🔵 RARE | 150 |
| Palais Royal | 🔵 RARE | 150 |
| Panthéon | 🔵 RARE | 150 |
| Sainte-Chapelle | 🔵 RARE | 150 |
| Opéra Garnier | 🔵 RARE | 150 |
| Place de la Bastille | ⚪ COMMON | 50 |
| Place des Vosges | ⚪ COMMON | 50 |

---

## Déploiement Vercel (gratuit)

### Option A — CLI

```bash
npm install -g vercel
vercel login
vercel
# Suivre les instructions
```

### Option B — GitHub + Vercel

1. Push le projet sur GitHub
2. Aller sur [vercel.com](https://vercel.com)
3. "New Project" → importer le repo GitHub
4. Vercel détecte Next.js automatiquement
5. Cliquer "Deploy" — c'est tout

Vercel héberge Next.js gratuitement avec CDN global.

---

## Personnalisation

### Changer la ville de départ
Dans `lib/constants.ts` :
```ts
export const DEFAULT_LAT = 48.8566  // Paris
export const DEFAULT_LNG = 2.3522
```

Remplacer par les coordonnées de votre ville.

### Ajouter des monuments
Dans `lib/constants.ts`, ajouter à `DEFAULT_MONUMENTS` :
```ts
{ id: 'm13', name: 'Big Ben', lat: 51.5007, lng: -0.1246, rarity: 'legendary', type: 'monument', discovered: false },
```

### Ajuster le rayon de révélation
```ts
export const TILE_SIZE_METERS = 10      // taille d'une case
export const REVEAL_RADIUS_METERS = 30  // rayon de révélation
```

---

## Architecture

```
terra-incognita/
├── app/
│   ├── layout.tsx        # Fonts, metadata
│   ├── page.tsx          # Page principale
│   └── globals.css       # Styles globaux + Leaflet overrides
├── components/
│   ├── MapExplorer.tsx   # Carte Leaflet + init
│   ├── FogCanvas.tsx     # Fog of War canvas overlay
│   ├── HUD.tsx           # Interface joueur
│   └── NotificationToast.tsx  # Récompenses animées
├── hooks/
│   └── useGameEngine.ts  # Logique de jeu complète
├── lib/
│   ├── constants.ts      # Config, monuments, badges
│   ├── geo.ts            # Calculs géographiques
│   └── storage.ts        # localStorage layer
└── types/
    └── game.ts           # Types TypeScript
```
