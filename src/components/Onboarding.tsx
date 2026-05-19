import { useState } from 'react'

const STEPS = [
  {
    icon: '🌫️',
    title: 'Un monde dans le brouillard',
    desc: 'Le monde entier est recouvert d\'un brouillard mystérieux. À toi de le révéler en explorant physiquement.',
  },
  {
    icon: '✨',
    title: 'Découvre des lieux uniques',
    desc: 'Des halos colorés indiquent des lieux cachés — monuments, grottes, cascades, volcans... Approche-toi pour les débloquer.',
  },
  {
    icon: '🏆',
    title: 'Collectionne & progresse',
    desc: 'Gagne de l\'XP, monte de niveau, débloque des badges et découvre des bonus en visitant de nouveaux pays.',
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const next = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1) }
    else {
      setLeaving(true)
      setTimeout(onDone, 500)
    }
  }

  const s = STEPS[step]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 40%, rgba(0,30,50,0.98) 0%, rgba(2,5,15,0.99) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, transition: 'opacity 0.5s', opacity: leaving ? 0 : 1,
    }}>
      {/* Stars bg */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        {[...Array(40)].map((_,i) => (
          <div key={i} style={{
            position:'absolute',
            width: Math.random()*2+1, height: Math.random()*2+1,
            borderRadius:'50%', background:'white',
            left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
            opacity: Math.random()*0.6+0.1,
            animation:`pulse ${Math.random()*3+2}s ease-in-out infinite`,
            animationDelay:`${Math.random()*3}s`
          }} />
        ))}
      </div>

      {/* Logo */}
      <img
        src="/logo.png" alt="Terra Incognita"
        className="logo-glow float"
        style={{width:110,height:110,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(0,245,212,0.4)',marginBottom:32}}
      />

      {/* Step indicator */}
      <div style={{display:'flex',gap:8,marginBottom:32}}>
        {STEPS.map((_,i) => (
          <div key={i} style={{
            width: i===step?24:8, height:8, borderRadius:4,
            background: i===step?'#00f5d4':'rgba(0,245,212,0.25)',
            transition:'all 0.3s',
          }} />
        ))}
      </div>

      {/* Content */}
      <div key={step} className="onboard-in" style={{textAlign:'center',maxWidth:320}}>
        <div style={{fontSize:56,marginBottom:20}}>{s.icon}</div>
        <h2 style={{fontSize:22,fontWeight:'bold',color:'#fff',marginBottom:12,fontFamily:'monospace',letterSpacing:'0.05em'}}>{s.title}</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.55)',lineHeight:1.7,marginBottom:40}}>{s.desc}</p>
      </div>

      {/* Button */}
      <button
        onClick={next}
        style={{
          background:'linear-gradient(135deg,#00b4a0,#00f5d4)',
          color:'#030810', border:'none', borderRadius:12,
          padding:'14px 40px', fontSize:15, fontWeight:'bold',
          fontFamily:'monospace', cursor:'pointer', letterSpacing:'0.05em',
          boxShadow:'0 0 30px rgba(0,245,212,0.4)',
          transition:'all 0.2s',
        }}
        onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.05)')}
        onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
      >
        {step < STEPS.length - 1 ? 'Suivant →' : '🚀 Commencer l\'aventure'}
      </button>

      <div style={{marginTop:20,fontSize:11,color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
        Terra Incognita — Explore the World
      </div>
    </div>
  )
}
