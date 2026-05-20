import { useRef, useState, useEffect } from 'react'
import { useGameEngine } from './hooks/useGameEngine'
import MapView from './components/MapView'
import HUD from './components/HUD'
import Toast from './components/Toast'
import Onboarding from './components/Onboarding'
import ScaleBar from './components/ScaleBar'
import { clearAll } from './lib/storage'
import { loadLang, saveLang, type Lang } from './lib/i18n'

const ONBOARD_KEY = 'ti2_onboarded'

export default function App() {
  const engine = useGameEngine()
  const mapRef = useRef<any>(null)
  const [showOnboard, setShowOnboard] = useState(false)
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    if (!localStorage.getItem(ONBOARD_KEY)) {
      setShowOnboard(true)
    } else {
      setLang(loadLang())
    }
  }, [])

  const finishOnboard = (selectedLang: Lang) => {
    localStorage.setItem(ONBOARD_KEY, '1')
    saveLang(selectedLang)
    setLang(selectedLang)
    setShowOnboard(false)
  }

  const handleReset = () => {
    if (!confirm(lang === 'fr' ? 'Réinitialiser toute la progression ? Impossible d\'annuler.' : 'Reset all progress? This cannot be undone.')) return
    clearAll()
    localStorage.removeItem(ONBOARD_KEY)
    window.location.reload()
  }

  if (!engine.initialized) {
    return (
      <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 40%, rgba(0,30,50,0.98) 0%, #020508 100%)',gap:20}}>
        <img src="/logo.png" alt="Terra Incognita" className="logo-glow float" style={{width:90,height:90,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(0,245,212,0.35)'}} />
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
          <div style={{color:'#00f5d4',fontFamily:'monospace',fontSize:13,letterSpacing:'0.25em',textTransform:'uppercase'}} className="animate-pulse">
            {lang === 'fr' ? 'Chargement...' : 'Loading...'}
          </div>
          <div style={{color:'rgba(255,255,255,0.15)',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase'}}>Terra Incognita</div>
        </div>
        <div style={{width:120,height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
          <div className="animate-pulse" style={{width:'60%',height:'100%',background:'linear-gradient(90deg,#00b4a0,#00f5d4)',borderRadius:2}} />
        </div>
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
        onReset={handleReset} lang={lang} onChangeLang={(l) => { setLang(l); saveLang(l) }}
      />
      <Toast notifications={engine.notifications} lang={lang} />
      <ScaleBar mapRef={mapRef as any} />
      <div style={{
        position:'absolute',inset:0,pointerEvents:'none',zIndex:550,
        background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.018) 2px,rgba(0,0,0,0.018) 4px)',
      }} />
      {showOnboard && <Onboarding onDone={finishOnboard} />}
    </div>
  )
}
