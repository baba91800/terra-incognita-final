import { useRef } from 'react'
import { useGameEngine } from './hooks/useGameEngine'
import MapView from './components/MapView'
import HUD from './components/HUD'
import Toast from './components/Toast'
import { clearAll } from './lib/storage'

export default function App() {
  const engine = useGameEngine()
  const mapRef = useRef<any>(null)

  const handleReset = () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return
    clearAll(); window.location.reload()
  }

  if (!engine.initialized) {
    return (
      <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#030810',gap:16}}>
        <img src="/logo.png" alt="Terra Incognita" style={{width:80,height:80,borderRadius:'50%',border:'2px solid rgba(0,245,212,0.3)'}} className="animate-pulse" />
        <div style={{color:'#00f5d4',fontFamily:'monospace',fontSize:13,letterSpacing:'0.2em'}} className="animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden',background:'#030810'}}>
      <MapView
        playerLat={engine.playerLat} playerLng={engine.playerLng}
        tiles={engine.tiles} monuments={engine.monuments}
        onMapReady={m => { mapRef.current = m }}
      />
      <HUD
        score={engine.score} xp={engine.xp} level={engine.level}
        xpIntoLevel={engine.xpIntoLevel} xpForNext={engine.xpForNext} levelTitle={engine.levelTitle}
        totalTiles={engine.totalTiles} explorationPercent={engine.explorationPercent} totalDist={engine.totalDist}
        badges={engine.badges} monuments={engine.monuments} countries={engine.countries}
        objectives={engine.objectives} log={engine.log} path={engine.path}
        tiles={engine.tiles} playerLat={engine.playerLat} playerLng={engine.playerLng}
        gpsActive={engine.gpsActive} onStartGPS={engine.startGPS} onStopGPS={engine.stopGPS}
        onReset={handleReset}
      />
      <Toast notifications={engine.notifications} />
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:550,
        background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)'}} />
    </div>
  )
}
