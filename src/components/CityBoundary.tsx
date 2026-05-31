import { useEffect, useRef } from 'react'

interface Props {
  mapRef: React.RefObject<any>
  boundary: [number,number][] | null
}

export default function CityBoundary({ mapRef, boundary }: Props) {
  const polyRef = useRef<any>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    import('leaflet').then(({ default: L }) => {
      if (polyRef.current) { polyRef.current.remove(); polyRef.current = null }
      if (!boundary || boundary.length < 3) return
      polyRef.current = L.polygon(boundary, {
        color: 'rgba(0,245,212,0.5)',
        weight: 1.5,
        fillColor: 'rgba(0,245,212,0.02)',
        fillOpacity: 1,
        dashArray: '6, 8',
        interactive: false,
      }).addTo(map)
    })
    return () => { if (polyRef.current) { polyRef.current.remove(); polyRef.current = null } }
  }, [boundary, mapRef.current]) // eslint-disable-line

  return null
}
