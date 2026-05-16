'use client'

import { DiscoveryLog as DLType } from '@/types/game'
import { RARITY_COLORS } from '@/lib/constants'

interface DiscoveryLogProps {
  log: DLType[]
  totalDistance: number
}

export default function DiscoveryLog({ log, totalDistance }: DiscoveryLogProps) {
  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="hud-panel w-72 max-h-[65vh] flex flex-col pointer-events-auto">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase">Discovery Log</div>
        <div className="text-[9px] text-white/20 font-mono">
          {(totalDistance / 1000).toFixed(2)} km total
        </div>
      </div>
      <div className="overflow-y-auto space-y-1.5 flex-1">
        {log.length === 0 && (
          <div className="text-white/20 text-xs text-center py-6">No discoveries yet</div>
        )}
        {log.map(entry => (
          <div key={entry.id} className="flex items-start gap-2.5 py-1.5 border-b border-white/5 last:border-0">
            <div className="text-base shrink-0 mt-0.5">{entry.icon}</div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: entry.rarity ? RARITY_COLORS[entry.rarity] : 'rgba(255,255,255,0.8)' }}
              >
                {entry.title}
              </div>
              {entry.subtitle && (
                <div className="text-[10px] text-white/30 truncate">{entry.subtitle}</div>
              )}
            </div>
            <div className="shrink-0 text-right">
              {entry.points && entry.points > 0 && (
                <div className="text-[10px] text-cyan-400/60 font-mono">+{entry.points}</div>
              )}
              <div className="text-[9px] text-white/15 font-mono">
                {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
