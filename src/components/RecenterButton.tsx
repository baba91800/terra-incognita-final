import { useEffect, useState } from 'react'

interface Props {
  mapRef: React.RefObject<any>
  playerLat: number
  playerLng: number
  onRecenter: () => void
}

export default function RecenterButton({ mapRef, playerLat, playerLng, onRecenter }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onDrag = () => setShow(true)
    map.on('dragstart', onDrag)
    return () => map.off('dragstart', onDrag)
  }, [mapRef.current]) // eslint-disable-line

  if (!show) return null

  const handleClick = () => {
    const map = mapRef.current
    if (!map) return
    map.panTo([playerLat, playerLng], { animate: true, duration: 0.4 })
    setShow(false)
    onRecenter()
  }

  return (
    <button onClick={handleClick} style={{
      position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 600, background: 'rgba(5,12,24,0.92)',
      border: '1px solid rgba(0,245,212,0.3)', borderRadius: 20,
      padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', color: '#00f5d4', fontSize: 11,
      fontFamily: 'monospace', letterSpacing: '0.08em',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      animation: 'toastIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: 14 }}>📍</span>
      <span>Recentrer</span>
    </button>
  )
}
