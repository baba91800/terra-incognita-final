import { TILE_SIZE_METERS } from './constants'

// Haversine distance between two lat/lng points in meters
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Convert lat/lng to tile coordinates
export function latLngToTile(lat: number, lng: number): { tx: number; ty: number } {
  // Use a reference origin; tiles are indexed in TILE_SIZE_METERS
  const METERS_PER_LAT = 111320
  const METERS_PER_LNG = 111320 * Math.cos((lat * Math.PI) / 180)
  const tx = Math.floor((lng * METERS_PER_LNG) / TILE_SIZE_METERS)
  const ty = Math.floor((lat * METERS_PER_LAT) / TILE_SIZE_METERS)
  return { tx, ty }
}

export function tileKey(tx: number, ty: number): string {
  return `${tx}:${ty}`
}

// Get all tile keys within radius of a position
export function tilesInRadius(
  lat: number,
  lng: number,
  radiusMeters: number
): string[] {
  const METERS_PER_LAT = 111320
  const METERS_PER_LNG = 111320 * Math.cos((lat * Math.PI) / 180)

  const latDelta = radiusMeters / METERS_PER_LAT
  const lngDelta = radiusMeters / METERS_PER_LNG

  const { tx: centerTx, ty: centerTy } = latLngToTile(lat, lng)
  const tilesRadius = Math.ceil(radiusMeters / TILE_SIZE_METERS) + 1

  const keys: string[] = []
  for (let dx = -tilesRadius; dx <= tilesRadius; dx++) {
    for (let dy = -tilesRadius; dy <= tilesRadius; dy++) {
      const tx = centerTx + dx
      const ty = centerTy + dy
      // Convert tile center back to lat/lng
      const tileLng = ((tx + 0.5) * TILE_SIZE_METERS) / METERS_PER_LNG
      const tileLat = ((ty + 0.5) * TILE_SIZE_METERS) / METERS_PER_LAT
      if (distanceMeters(lat, lng, tileLat, tileLng) <= radiusMeters) {
        keys.push(tileKey(tx, ty))
      }
    }
  }
  return keys
}

// Move lat/lng by meters in a direction
export function movePosition(
  lat: number,
  lng: number,
  direction: 'north' | 'south' | 'east' | 'west',
  meters: number
): { lat: number; lng: number } {
  const METERS_PER_LAT = 111320
  const METERS_PER_LNG = 111320 * Math.cos((lat * Math.PI) / 180)

  switch (direction) {
    case 'north': return { lat: lat + meters / METERS_PER_LAT, lng }
    case 'south': return { lat: lat - meters / METERS_PER_LAT, lng }
    case 'east': return { lat, lng: lng + meters / METERS_PER_LNG }
    case 'west': return { lat, lng: lng - meters / METERS_PER_LNG }
  }
}
