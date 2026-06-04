import { useState, useEffect, useRef } from 'react'

// Hook de direction — priorité GPS sur gyroscope
// Le gyroscope donne souvent des valeurs instables
// On calcule le cap depuis le déplacement GPS = beaucoup plus fiable

export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null)
  const gyroHeading = useRef<number | null>(null)
  const gpsHeading = useRef<number | null>(null)
  const prevPos = useRef<{ lat: number; lng: number; time: number } | null>(null)
  const smoothed = useRef<number | null>(null)

  // Écouter le gyroscope
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const alpha = (e as any).webkitCompassHeading ?? e.alpha
      if (alpha !== null) {
        gyroHeading.current = Math.round(alpha)
        // N'utiliser le gyroscope que si on n'a pas de cap GPS récent
        if (gpsHeading.current === null) {
          setHeading(gyroHeading.current)
        }
      }
    }
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true)
      window.addEventListener('deviceorientation', handleOrientation as any, true)
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true)
      window.removeEventListener('deviceorientation', handleOrientation as any, true)
    }
  }, [])

  // Calculer le cap depuis le GPS — appelé depuis useGameEngine
  const updateGPSHeading = (lat: number, lng: number) => {
    const now = Date.now()
    if (prevPos.current) {
      const dLat = lat - prevPos.current.lat
      const dLng = lng - prevPos.current.lng
      const dist = Math.sqrt(dLat * dLat + dLng * dLng)
      const dt = now - prevPos.current.time

      // Calculer seulement si déplacement suffisant (>3m) et récent
      if (dist > 0.00003 && dt < 10000) {
        const rawAngle = Math.atan2(dLng, dLat) * 180 / Math.PI
        const angle = (rawAngle + 360) % 360

        // Lissage exponentiel pour éviter les sauts
        if (smoothed.current === null) {
          smoothed.current = angle
        } else {
          // Interpolation angulaire courte
          let diff = angle - smoothed.current
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          smoothed.current = (smoothed.current + diff * 0.4 + 360) % 360
        }

        gpsHeading.current = Math.round(smoothed.current)
        setHeading(gpsHeading.current)
      }
    }
    prevPos.current = { lat, lng, time: now }
  }

  return { heading, updateGPSHeading }
}
