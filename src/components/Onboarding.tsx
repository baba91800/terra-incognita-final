import { useState } from 'react'
import { LANGS, T, type Lang, saveLang } from '../lib/i18n'

interface Props {
  onDone: (lang: Lang) => void
}

export default function Onboarding({ onDone }: Props) {
  const [lang, setLang] = useState<Lang>('fr')
  const [step, setStep] = useState(-1) // -1 = language selection
  const [leaving, setLeaving] = useState(false)
  const t = T[lang]

  const STEPS = [
    { icon: '🌫️', title: t.onboardTitle1, desc: t.onboardDesc1 },
    { icon: '✨', title: t.onboardTitle2, desc: t.onboardDesc2 },
    { icon: '🏆', title: t.onboardTitle3, desc: t.onboardDesc3 },
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

  const selectLang = (l: Lang) => { setLang(l) }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'radial-gradient(ellipse at 50% 35%, rgba(0,35,55,0.98) 0%, rgba(2,5,15,0.99) 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:24, transition:'opacity 0.5s', opacity: leaving ? 0 : 1,
    }}>
      {/* Stars */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        {[...Array(45)].map((_,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'white',
            width:Math.random()*2+0.5, height:Math.random()*2+0.5,
            left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
            opacity:Math.random()*0.5+0.1,
            animation:`pulse ${Math.random()*4+2}s ease-in-out infinite`,
            animationDelay:`${Math.random()*3}s`,
          }} />
        ))}
      </div>

      {/* Logo */}
      <img src="/logo.png" alt="Terra Incognita" className="logo-glow float" style={{
        width:100, height:100, borderRadius:'50%', objectFit:'cover',
        border:'2px solid rgba(0,245,212,0.4)', marginBottom:28,
      }} />

      {/* Language selection */}
      {step === -1 && (
        <div key="lang" className="onboard-in" style={{textAlign:'center',width:'100%',maxWidth:340}}>
          <div style={{fontSize:12,letterSpacing:'0.2em',color:'rgba(0,245,212,0.6)',textTransform:'uppercase',marginBottom:20}}>
            {t.chooseLanguage}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:32}}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => selectLang(l.code)} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 18px', borderRadius:10, cursor:'pointer',
                background: lang===l.code ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lang===l.code ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color:'#fff', fontSize:14, transition:'all 0.2s',
                boxShadow: lang===l.code ? '0 0 16px rgba(0,245,212,0.2)' : 'none',
              }}>
                <span style={{fontSize:22}}>{l.flag}</span>
                <span style={{fontWeight: lang===l.code ? 'bold' : 'normal'}}>{l.label}</span>
                {lang===l.code && <span style={{marginLeft:'auto',color:'#00f5d4'}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {step >= 0 && (
        <>
          {/* Step dots */}
          <div style={{display:'flex',gap:8,marginBottom:28}}>
            {STEPS.map((_,i)=>(
              <div key={i} style={{
                width:i===step?24:8, height:8, borderRadius:4,
                background:i===step?'#00f5d4':'rgba(0,245,212,0.25)',
                transition:'all 0.3s',
              }} />
            ))}
          </div>

          <div key={step} className="onboard-in" style={{textAlign:'center',maxWidth:320}}>
            <div style={{fontSize:52,marginBottom:18}}>{STEPS[step].icon}</div>
            <h2 style={{fontSize:20,fontWeight:'bold',color:'#fff',marginBottom:12,fontFamily:'monospace',letterSpacing:'0.04em'}}>{STEPS[step].title}</h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.75,marginBottom:36}}>{STEPS[step].desc}</p>
          </div>
        </>
      )}

      {/* Button */}
      <button onClick={next} style={{
        background:'linear-gradient(135deg,#00b4a0,#00f5d4)',
        color:'#030810', border:'none', borderRadius:12,
        padding:'14px 40px', fontSize:15, fontWeight:'bold',
        fontFamily:'monospace', cursor:'pointer', letterSpacing:'0.04em',
        boxShadow:'0 0 30px rgba(0,245,212,0.4)', transition:'all 0.2s',
      }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
      >
        {step === -1 ? (T[lang].next) : step < STEPS.length - 1 ? t.next : t.start}
      </button>

      <div style={{marginTop:18,fontSize:10,color:'rgba(255,255,255,0.15)',letterSpacing:'0.12em',textTransform:'uppercase'}}>
        Terra Incognita · Explore the World
      </div>
    </div>
  )
}
