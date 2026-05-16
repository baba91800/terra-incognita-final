'use client'

interface XPBarProps {
  level: number
  levelTitle: string
  xpIntoLevel: number
  xpForNext: number
}

export default function XPBar({ level, levelTitle, xpIntoLevel, xpForNext }: XPBarProps) {
  const pct = Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))

  return (
    <div className="hud-panel px-3 py-2 min-w-[200px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center text-[10px] font-bold text-cyan-400 font-mono">
            {level}
          </div>
          <span className="text-[10px] tracking-widest text-white/50 uppercase">{levelTitle}</span>
        </div>
        <span className="text-[9px] text-white/25 font-mono">{xpIntoLevel}/{xpForNext} XP</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00b4a0, #00f5d4)',
            boxShadow: '0 0 8px rgba(0, 245, 212, 0.5)',
          }}
        />
      </div>
    </div>
  )
}
