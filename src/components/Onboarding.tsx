import { useState, useMemo } from 'react'
import { LANGS, T, type Lang, saveLang } from '../lib/i18n'

interface Props {
  onDone: (lang: Lang) => void
}

function useStars(count: number) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    key: i,
    size: Math.random() * 2 + 0.5,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    opacity: Math.random() * 0.5 + 0.1,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 3,
  })), [])
}

export default function Onboarding({ onDone }: Props) {
  const [lang, setLang] = useState<Lang>('fr')
  const [step, setStep] = useState(-1)
  const [leaving, setLeaving] = useState(false)
  const t = T[lang]
  const stars = useStars(45)

  const STEPS = [
    {
      icon: '🌫️',
      title: t.onboardTitle1,
      desc: t.onboardDesc1,
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 120, height: 80, borderRadius: 12, background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.15)', position: 'relative', overflow: 'hidden' }}>
            {/* Fog */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgb(2,5,15)' }} />
            {/* Revealed area */}
            <div style={{ position: 'absolute', left: 40, top: 20, width: 50, height: 40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgb(2,5,15) 100%)', boxShadow: '0 0 0 100px rgb(2,5,15)' }}>
              <div style={{ width: '100%', height: '100%', background: 'rgba(180,200,160,0.3)', borderRadius: '50%' }} />
            </div>
            {/* Player dot */}
            <div style={{ position: 'absolute', left: 62, top: 37, width: 8, height: 8, borderRadius: '50%', background: '#00f5d4', boxShadow: '0 0 8px rgba(0,245,212,0.8)' }} />
          </div>
        </div>
      )
    },
    {
      icon: '✨',
      title: t.onboardTitle2,
      desc: t.onboardDesc2,
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          {[
            { color: '#f59e0b', size: 14, label: 'Légendaire' },
            { color: '#a855f7', size: 11, label: 'Épique' },
            { color: '#3b82f6', size: 9,  label: 'Rare' },
            { color: '#9ca3af', size: 7,  label: 'Commun' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: m.size * 3, height: m.size * 3, borderRadius: '50%', background: m.color, boxShadow: `0 0 ${m.size * 2}px ${m.color}` }} />
              <span style={{ fontSize: 7, color: m.color, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{m.label}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: '📍',
      title: 'Active le GPS',
      desc: 'Appuie sur le bouton GPS en haut à droite pour commencer à explorer. La carte se dévoile automatiquement à chaque pas.',
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 20px' }}>
            <span style={{ fontSize: 24 }}>📡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#4ade80', fontFamily: 'monospace' }}>GPS actif</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Localisation en cours...</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 1s infinite' }} />
          </div>
        </div>
      )
    },
    {
      icon: '🏆',
      title: t.onboardTitle3,
      desc: t.onboardDesc3,
      visual: (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {['👣','🗺️','🏛️','⭐','🌍','🔥','❄️','🏆'].map(icon => (
            <div key={icon} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,245,212,0.08)', border: '1px solid rgba(0,245,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {icon}
            </div>
          ))}
        </div>
      )
    },
  ]

  const next = () => {
    if (step === -1) { setStep(0); return }
    if (step < STEPS.length - 1) { setStep(s => s + 1) }
    else {
      setLeaving(true)
      saveLang(lang)
      setTimeout(() => onDone(lang), 500)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 35%, rgba(0,35,55,0.98) 0%, rgba(2,5,15,0.99) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, transition: 'opacity 0.5s', opacity: leaving ? 0 : 1,
    }}>
      {/* Étoiles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {stars.map(s => (
          <div key={s.key} style={{
            position: 'absolute', borderRadius: '50%', background: 'white',
            width: s.size, height: s.size, left: s.left, top: s.top,
            opacity: s.opacity,
            animation: `pulse ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      {/* Logo */}
      <img src="/logo.png" alt="Terra Incognita" className="logo-glow float" style={{
        width: step === -1 ? 100 : 70, height: step === -1 ? 100 : 70,
        borderRadius: '50%', objectFit: 'cover',
        border: '2px solid rgba(0,245,212,0.4)', marginBottom: step === -1 ? 28 : 16,
        transition: 'all 0.3s',
      }} />

      {/* Choix langue */}
      {step === -1 && (
        <div key="lang" className="onboard-in" style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase', marginBottom: 20 }}>
            {t.chooseLanguage}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px', borderRadius: 10, cursor: 'pointer',
                background: lang === l.code ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lang === l.code ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: '#fff', fontSize: 14, transition: 'all 0.2s',
                boxShadow: lang === l.code ? '0 0 16px rgba(0,245,212,0.2)' : 'none',
              }}>
                <span style={{ fontSize: 22 }}>{l.flag}</span>
                <span style={{ fontWeight: lang === l.code ? 'bold' : 'normal' }}>{l.label}</span>
                {lang === l.code && <span style={{ marginLeft: 'auto', color: '#00f5d4' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {step >= 0 && (
        <>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i === step ? '#00f5d4' : i < step ? 'rgba(0,245,212,0.4)' : 'rgba(0,245,212,0.15)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          <div key={step} className="onboard-in" style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
            {STEPS[step].visual}
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              {STEPS[step].title}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 28 }}>
              {STEPS[step].desc}
            </p>
          </div>
        </>
      )}

      {/* Bouton */}
      <button onClick={next} style={{
        background: 'linear-gradient(135deg,#00b4a0,#00f5d4)',
        color: '#030810', border: 'none', borderRadius: 12,
        padding: '14px 40px', fontSize: 15, fontWeight: 'bold',
        fontFamily: 'monospace', cursor: 'pointer', letterSpacing: '0.04em',
        boxShadow: '0 0 30px rgba(0,245,212,0.4)', transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {step === -1 ? T[lang].next : step < STEPS.length - 1 ? t.next : t.start}
      </button>

      <div style={{ marginTop: 18, fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Terra Incognita · Explore the World
      </div>
    </div>
  )
}
