import { useRef, useState, useEffect } from 'react'
import { useGameEngine, useHeading } from './hooks/useGameEngine'
import MapView from './components/MapView'
import HUD from './components/HUD'
import Toast from './components/Toast'
import Onboarding from './components/Onboarding'
import ScaleBar from './components/ScaleBar'
import NavLine from './components/NavLine'
import Compass from './components/Compass'
import ProximityAlert from './components/ProximityAlert'
import ProfileScreen from './components/ProfileScreen'
import MarkerEditor from './components/MarkerEditor'
import TerritoryBar from './components/TerritoryBar'
import { clearAll, loadMarkers, saveMarkers } from './lib/storage'
import { loadLang, saveLang, useT, type Lang } from './lib/i18n'
import type { Monument, PersonalMarker } from './types/game'

const ONBOARD_KEY = 'ti2_onboarded'

export default function App() {
  const engine = useGameEngine()
  const { heading } = useHeading()
  const mapRef = useRef<any>(null)
  const [showOnboard, setShowOnboard] = useState(false)
  const [lang, setLang] = useState<Lang>('fr')
  const [navTarget, setNavTarget] = useState<Monument | null>(null)
  const [showArrivedMsg, setShowArrivedMsg] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [personalMarkers, setPersonalMarkers] = useState<PersonalMarker[]>(() => loadMarkers())
  const [markerEditor, setMarkerEditor] = useState<{ lat: number; lng: number; existing?: PersonalMarker } | null>(null)
  const t = useT(lang)

  useEffect(() => {
    if (!localStorage.getItem(ONBOARD_KEY)) setShowOnboard(true)
    else setLang(loadLang())
  }, [])

  const finishOnboard = (selectedLang: Lang) => {
    localStorage.setItem(ONBOARD_KEY, '1')
    saveLang(selectedLang)
    setLang(selectedLang)
    setShowOnboard(false)
  }

  // FIX #4 — handleReset maintenant accessible via ProfileScreen
  const handleReset = () => {
    if (!confirm(t.resetConfirm)) return
    clearAll()
    localStorage.removeItem(ONBOARD_KEY)
    window.location.reload()
  }

  const handleArrived = () => {
    setNavTarget(null)
    setShowArrivedMsg(true)
    setTimeout(() => setShowArrivedMsg(false), 3000)
  }

  const handleSaveMarker = (m: PersonalMarker) => {
    const updated = personalMarkers.find(x => x.id === m.id)
      ? personalMarkers.map(x => x.id === m.id ? m : x)
      : [...personalMarkers, m]
    setPersonalMarkers(updated)
    saveMarkers(updated)
  }

  const handleDeleteMarker = (id: string) => {
    const updated = personalMarkers.filter(m => m.id !== id)
    setPersonalMarkers(updated)
    saveMarkers(updated)
  }

  if (!engine.initialized) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%, rgba(0,30,50,0.98) 0%, #020508 100%)', gap: 20 }}>
        <img src="/logo.png" alt="Terra Incognita" className="logo-glow float" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,245,212,0.35)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ color: '#00f5d4', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase' }} className="animate-pulse">{t.loading}</div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Terra Incognita</div>
        </div>
        <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div className="animate-pulse" style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg,#00b4a0,#00f5d4)', borderRadius: 2 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#030810' }}>
      {/* Map */}
      <MapView
        playerLat={engine.playerLat} playerLng={engine.playerLng}
        tiles={engine.tiles} monuments={engine.monuments}
        personalMarkers={personalMarkers}
        heading={heading}
        onMapReady={m => { mapRef.current = m }}
        onMonumentClick={m => !m.discovered && setNavTarget(m)}
        onLongPress={(lat, lng) => setMarkerEditor({ lat, lng })}
        onMarkerClick={m => setMarkerEditor({ lat: m.lat, lng: m.lng, existing: m })}
      />

      {/* Navigation */}
      <NavLine
        mapRef={mapRef as any} target={navTarget}
        playerLat={engine.playerLat} playerLng={engine.playerLng}
        onCancel={() => setNavTarget(null)}
        onArrived={handleArrived} t={t}
      />

      {/* HUD — FIX #5 : onOpenProfile passé une seule fois */}
      <HUD
        score={engine.score} xp={engine.xp} level={engine.level}
        xpIntoLevel={engine.xpIntoLevel} xpForNext={engine.xpForNext} levelTitle={engine.levelTitle}
        totalTiles={engine.totalTiles} explorationPercent={engine.explorationPercent} totalDist={engine.totalDist}
        badges={engine.badges} monuments={engine.monuments} countries={engine.countries}
        objectives={engine.objectives} log={engine.log} path={engine.path}
        tiles={engine.tiles} playerLat={engine.playerLat} playerLng={engine.playerLng}
        gpsActive={engine.gpsActive} onStartGPS={engine.startGPS} onStopGPS={engine.stopGPS}
        onOpenProfile={() => setShowProfile(true)}
        lang={lang} onChangeLang={l => { setLang(l); saveLang(l) }}
        t={t}
      />

      {/* Toasts */}
      <Toast notifications={engine.notifications} lang={lang} />

      {/* Scale bar */}
      <ScaleBar mapRef={mapRef as any} />
      <Compass heading={heading} />
      <TerritoryBar territory={engine.territory} totalTiles={engine.totalTiles} />

      {/* Proximity alert */}
      <ProximityAlert
        monuments={engine.monuments}
        playerLat={engine.playerLat} playerLng={engine.playerLng}
        t={t} onNavigate={m => setNavTarget(m)}
      />

      {/* Arrived message */}
      {showArrivedMsg && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 800, pointerEvents: 'none',
          background: 'rgba(5,12,24,0.97)', border: '1px solid rgba(34,197,94,0.5)',
          borderRadius: 16, padding: '20px 32px', textAlign: 'center',
          boxShadow: '0 0 40px rgba(34,197,94,0.3)',
          animation: 'toastIn 0.4s ease-out',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4ade80', fontFamily: 'monospace' }}>{t.arrived}</div>
        </div>
      )}

      {/* Hint */}
      {!navTarget && engine.gpsActive && (
        <div style={{ position: 'absolute', bottom: 16, right: 60, zIndex: 600, pointerEvents: 'none', fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {t.tapHaloHint}
        </div>
      )}

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 550, background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.018) 2px,rgba(0,0,0,0.018) 4px)' }} />

      {/* Profile screen — FIX #4 : onReset branché */}
      {showProfile && (
        <ProfileScreen
          onClose={() => setShowProfile(false)}
          onReset={handleReset}
          score={engine.score} xp={engine.xp} level={engine.level} levelTitle={engine.levelTitle}
          totalTiles={engine.totalTiles} totalDist={engine.totalDist}
          badges={engine.badges} monuments={engine.monuments} countries={engine.countries}
          tiles={engine.tiles} playerLat={engine.playerLat} playerLng={engine.playerLng}
          territory={engine.territory}
          t={t}
        />
      )}

      {/* Onboarding */}
      {showOnboard && <Onboarding onDone={finishOnboard} />}

      {/* Marker editor */}
      {markerEditor && (
        <MarkerEditor
          lat={markerEditor.lat} lng={markerEditor.lng}
          existing={markerEditor.existing}
          onSave={handleSaveMarker}
          onDelete={handleDeleteMarker}
          onClose={() => setMarkerEditor(null)}
        />
      )}
    </div>
  )
}
