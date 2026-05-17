'use client'

import { useState, useEffect } from 'react'
import { Badge, Monument, CountryDiscovery, DailyObjective, DiscoveryLog as DLType, ExplorationPath } from '@/types/game'
import { RARITY_COLORS, RARITY_LABELS } from '@/lib/constants'
import XPBar from './XPBar'
import MiniMap from './MiniMap'
import ObjectivesPanel from './ObjectivesPanel'
import DiscoveryLog from './DiscoveryLog'

interface HUDProps {
  score: number
  xp: number
  level: number
  xpIntoLevel: number
  xpForNext: number
  levelTitle: string
  totalTiles: number
  explorationPercent: string
  totalDistance: number
  badges: Badge[]
  monuments: Monument[]
  countries: CountryDiscovery[]
  objectives: DailyObjective[]
  discoveryLog: DLType[]
  explorationPath: ExplorationPath[]
  discoveredTiles: Set<string>
  playerLat: number
  playerLng: number
  gpsActive: boolean
  onStartGPS: () => void
  onStopGPS: () => void
  onReset: () => void
}

type Panel = 'none' | 'badges' | 'monuments' | 'countries' | 'objectives' | 'log' | 'stats'

export default function HUD({
  score, xp, level, xpIntoLevel, xpForNext, levelTitle,
  totalTiles, explorationPercent, totalDistance,
  badges, monuments, countries, objectives, discoveryLog, explorationPath,
  discoveredTiles, playerLat, playerLng,
  gpsActive, onStartGPS, onStopGPS, onReset
}: HUDProps) {
  const [panel, setPanel] = useState<Panel>('none')
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showInstall, setShowInstall] = useState(false)

  const earnedBadges = badges.filter(b => b.earned)
  const discoveredMonuments = monuments.filter(m => m.discovered)
  const todayCompleted = objectives.filter(o => o.completed).length

  const togglePanel = (p: Panel) => setPanel(prev => prev === p ? 'none' : p)

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    const prompt = installPrompt as BeforeInstallPromptEvent
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') setShowInstall(false)
  }

  return (
    <>
      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-[600] pointer-events-none">
        <div className="flex items-start justify-between p-3 gap-2">

          {/* Left: Score + XP */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="hud-panel">
              <div className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase mb-0.5">Explorer Points</div>
              <div className="text-2xl font-bold text-cyan-400 tabular-nums font-mono leading-none">{score.toLocaleString()}</div>
              <div className="flex gap-3 mt-2">
                <div>
                  <div className="text-[9px] tracking-widest text-white/25 uppercase">Tiles</div>
                  <div className="text-xs font-mono text-white/60">{totalTiles.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest text-white/25 uppercase">Zone</div>
                  <div className="text-xs font-mono text-white/60">{explorationPercent}%</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest text-white/25 uppercase">km</div>
                  <div className="text-xs font-mono text-white/60">{(totalDistance / 1000).toFixed(2)}</div>
                </div>
              </div>
            </div>
            <XPBar level={level} levelTitle={levelTitle} xpIntoLevel={xpIntoLevel} xpForNext={xpForNext} />
          </div>

          {/* Center: Logo + Title */}
          <div className="flex-1 flex justify-center pt-1 pointer-events-none">
            <div className="text-center flex flex-col items-center">
              <img src="/logo.png" alt="Terra Incognita" className="w-12 h-12 rounded-full border border-cyan-400/20 mb-1" />
              <div className="text-[9px] tracking-[0.15em] text-white/40 uppercase font-mono">Terra Incognita</div>
            </div>
          </div>

          {/* Right: buttons */}
          <div className="flex flex-col gap-1.5 items-end pointer-events-auto">
            {/* GPS button */}
            <button
              onClick={gpsActive ? onStopGPS : onStartGPS}
              className={`hud-btn text-xs px-3 py-1.5 ${gpsActive ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'text-cyan-400'}`}
            >
              {gpsActive ? '📡 GPS ON' : '📍 Activer GPS'}
            </button>

            {/* Install PWA */}
            {showInstall && (
              <button
                onClick={handleInstall}
                className="hud-btn text-xs px-3 py-1.5 bg-cyan-400/20 border-cyan-400/50 text-cyan-300"
              >
                📲 Installer l'app
              </button>
            )}

            {/* Panel buttons */}
            <div className="flex gap-1 flex-wrap justify-end max-w-[160px]">
              {[
                { id: 'badges' as Panel,     icon: '🏅', count: earnedBadges.length },
                { id: 'monuments' as Panel,  icon: '🏛️', count: discoveredMonuments.length },
                { id: 'countries' as Panel,  icon: '🌍', count: countries.length },
                { id: 'objectives' as Panel, icon: '🎯', count: todayCompleted },
                { id: 'log' as Panel,        icon: '📜', count: discoveryLog.length },
                { id: 'stats' as Panel,      icon: '📊', count: null },
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => togglePanel(btn.id)}
                  className={`hud-btn text-xs px-2 py-1 ${panel === btn.id ? 'bg-cyan-400/20 border-cyan-400/50' : ''}`}
                >
                  {btn.icon}{btn.count !== null ? ` ${btn.count}` : ''}
                </button>
              ))}
            </div>

            <button onClick={onReset} className="text-[9px] text-red-400/30 hover:text-red-400/60 tracking-widest uppercase transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── LEFT PANELS ── */}
      {panel === 'badges' && (
        <div className="absolute top-44 left-3 z-[600] w-64 hud-panel pointer-events-auto max-h-[55vh] overflow-y-auto">
          <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase mb-3">Badges — {earnedBadges.length}/{badges.length}</div>
          <div className="space-y-2">
            {badges.map(b => (
              <div key={b.id} className={`flex items-center gap-3 p-2 rounded border transition-all ${b.earned ? 'border-cyan-400/30 bg-cyan-400/5' : 'border-white/5 opacity-40'}`}>
                <span className="text-xl">{b.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${b.earned ? 'text-white' : 'text-white/40'}`}>{b.name}</div>
                  <div className="text-[10px] text-white/30 truncate">{b.description}</div>
                  {b.earnedAt && <div className="text-[9px] text-cyan-400/50 mt-0.5">{new Date(b.earnedAt).toLocaleDateString()}</div>}
                </div>
                {!b.earned && <span className="text-white/20 text-xs">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === 'objectives' && (
        <div className="absolute top-44 left-3 z-[600] pointer-events-auto">
          <ObjectivesPanel objectives={objectives} />
        </div>
      )}

      {panel === 'log' && (
        <div className="absolute top-44 left-3 z-[600] pointer-events-auto">
          <DiscoveryLog log={discoveryLog} totalDistance={totalDistance} />
        </div>
      )}

      {/* ── RIGHT PANELS ── */}
      {panel === 'monuments' && (
        <div className="absolute top-44 right-3 z-[600] w-72 hud-panel pointer-events-auto max-h-[55vh] overflow-y-auto">
          <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase mb-3">Monuments — {discoveredMonuments.length}/{monuments.length}</div>
          <div className="space-y-2">
            {monuments.map(m => (
              <div key={m.id} className={`flex items-center gap-3 p-2 rounded border ${m.discovered ? 'border-white/20 bg-white/5' : 'border-white/5'}`}>
                <div className="text-base">{m.discovered ? (m.type === 'museum' ? '🏛️' : m.type === 'cathedral' ? '⛪' : '🗺️') : '❓'}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${m.discovered ? 'text-white' : 'text-white/25'}`}>{m.discovered ? m.name : '??? Unknown Site'}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: RARITY_COLORS[m.rarity] }}>{RARITY_LABELS[m.rarity]}</div>
                </div>
                {m.discovered && <span className="text-green-400 text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === 'countries' && (
        <div className="absolute top-44 right-3 z-[600] w-72 hud-panel pointer-events-auto max-h-[55vh] overflow-y-auto">
          <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase mb-3">Countries — {countries.length} discovered</div>
          {countries.length === 0 && <div className="text-white/25 text-xs text-center py-4">Visite un nouveau pays pour débloquer un bonus</div>}
          <div className="space-y-2">
            {[...countries].sort((a, b) => b.points - a.points).map(c => (
              <div key={c.code} className="flex items-center gap-3 p-2 rounded border border-white/10 bg-white/5">
                <div className="text-xl">{c.flag}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: RARITY_COLORS[c.rarity] }}>{RARITY_LABELS[c.rarity]} · +{c.points} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === 'stats' && (
        <div className="absolute top-44 right-3 z-[600] w-72 hud-panel pointer-events-auto">
          <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase mb-4">Statistics</div>
          <div className="space-y-3">
            {[
              { label: 'Total XP',           value: xp.toLocaleString(),                              icon: '⚡' },
              { label: 'Level',              value: `${level} — ${levelTitle}`,                       icon: '🎖️' },
              { label: 'Tiles Discovered',   value: totalTiles.toLocaleString(),                      icon: '🗺️' },
              { label: 'Distance Walked',    value: `${(totalDistance / 1000).toFixed(2)} km`,        icon: '👟' },
              { label: 'Monuments Found',    value: `${discoveredMonuments.length}/${monuments.length}`, icon: '🏛️' },
              { label: 'Countries Visited',  value: countries.length.toString(),                      icon: '🌍' },
              { label: 'Badges Earned',      value: `${earnedBadges.length}/${badges.length}`,        icon: '🏅' },
              { label: 'Zone Explored',      value: `${explorationPercent}%`,                         icon: '📍' },
              { label: 'Objectives Done',    value: objectives.filter(o => o.completed).length.toString(), icon: '🎯' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{row.icon}</span>
                  <span className="text-xs text-white/40">{row.label}</span>
                </div>
                <span className="text-xs font-mono text-white/70">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MINI MAP ── */}
      <div className="absolute bottom-4 left-3 z-[600] pointer-events-none">
        <MiniMap
          discoveredTiles={discoveredTiles}
          playerLat={playerLat}
          playerLng={playerLng}
          explorationPath={explorationPath}
        />
      </div>

      {/* ── GPS STATUS (bottom center) ── */}
      {!gpsActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[600] pointer-events-auto">
          <button
            onClick={onStartGPS}
            className="hud-panel flex items-center gap-3 px-5 py-3 cursor-pointer hover:border-cyan-400/40 transition-all"
          >
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-xs font-bold text-cyan-400">Activer le GPS</div>
              <div className="text-[10px] text-white/30">Pour commencer à explorer</div>
            </div>
          </button>
        </div>
      )}

      {gpsActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[600] pointer-events-auto">
          <div className="hud-panel flex items-center gap-3 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">GPS actif — marche pour explorer</span>
            <button onClick={onStopGPS} className="text-[10px] text-red-400/50 hover:text-red-400 ml-2">Stop</button>
          </div>
        </div>
      )}
    </>
  )
}

// TypeScript type for PWA install prompt
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}
