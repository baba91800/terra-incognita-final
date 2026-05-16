'use client'

import { DailyObjective } from '@/types/game'
import { todayString } from '@/lib/constants'

interface ObjectivesPanelProps {
  objectives: DailyObjective[]
}

export default function ObjectivesPanel({ objectives }: ObjectivesPanelProps) {
  const today = todayString()
  const todayObjs = objectives.filter(o => o.date === today)
  const completed = todayObjs.filter(o => o.completed).length

  return (
    <div className="hud-panel w-72 pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.2em] text-cyan-400/60 uppercase">Daily Objectives</div>
        <div className="text-[10px] text-white/30 font-mono">{completed}/{todayObjs.length} done</div>
      </div>
      <div className="space-y-3">
        {todayObjs.map(obj => {
          const pct = Math.min(100, obj.target > 0 ? (obj.current / obj.target) * 100 : 0)
          return (
            <div key={obj.id} className={`transition-opacity ${obj.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{obj.icon}</span>
                  <span className={`text-xs ${obj.completed ? 'line-through text-white/30' : 'text-white/70'}`}>
                    {obj.description}
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400/60 font-mono ml-2 shrink-0">+{obj.reward} XP</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-7">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: obj.completed
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #00b4a0, #00f5d4)',
                  }}
                />
              </div>
              <div className="text-[9px] text-white/20 font-mono ml-7 mt-0.5">
                {obj.current}/{obj.target}
                {obj.completed && <span className="text-green-400/60 ml-2">✓ Complete</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
