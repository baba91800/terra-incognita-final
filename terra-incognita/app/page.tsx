'use client'

import { useRef, useState } from 'react'
import type L from 'leaflet'
import dynamic from 'next/dynamic'
import { useGameEngine } from '@/hooks/useGameEngine'
import HUD from '@/components/HUD'
import NotificationToast from '@/components/NotificationToast'
import { clearAll } from '@/lib/storage'

const MapExplorer = dynamic(() => import('@/components/MapExplorer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030810]">
      <div className="text-center">
        <div className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">INITIALIZING MAP...</div>
        <div className="text-white/20 text-xs mt-2 tracking-wider">TERRA INCOGNITA</div>
      </div>
    </div>
  ),
})

export default function Home() {
  const engine = useGameEngine()
  const mapRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const handleMapReady = (map: L.Map) => { mapRef.current = map; setMapReady(true) }

  const handleReset = () => {
    if (!confirm('Reset all exploration progress? This cannot be undone.')) return
    clearAll()
    window.location.reload()
  }

  if (!engine.initialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#030810]">
        <div className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030810]">
      <MapExplorer
        playerLat={engine.playerLat}
        playerLng={engine.playerLng}
        discoveredTiles={engine.discoveredTiles}
        monuments={engine.monuments}
        onMapReady={handleMapReady}
      />
      <HUD
        score={engine.score}
        xp={engine.xp}
        level={engine.level}
        xpIntoLevel={engine.xpIntoLevel}
        xpForNext={engine.xpForNext}
        levelTitle={engine.levelTitle}
        totalTiles={engine.totalTiles}
        explorationPercent={engine.explorationPercent}
        totalDistance={engine.totalDistance}
        badges={engine.badges}
        monuments={engine.monuments}
        countries={engine.countries}
        objectives={engine.objectives}
        discoveryLog={engine.discoveryLog}
        explorationPath={engine.explorationPath}
        discoveredTiles={engine.discoveredTiles}
        playerLat={engine.playerLat}
        playerLng={engine.playerLng}
        gpsActive={engine.gpsActive}
        onMove={engine.moveDirect}
        onStartGPS={engine.startGPS}
        onStopGPS={engine.stopGPS}
        onReset={handleReset}
      />
      <NotificationToast notifications={engine.notifications} />
      <div
        className="absolute inset-0 pointer-events-none z-[550]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)' }}
      />
    </main>
  )
}
