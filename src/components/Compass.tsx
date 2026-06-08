// Boussole heading-up — le N pointe toujours vers le vrai Nord
// quand la carte tourne, la boussole montre où est le Nord
interface Props {
  heading: number | null
}

export default function Compass({ heading }: Props) {
  // En mode heading-up, la carte est tournée de -heading degrés
  // La boussole doit afficher le Nord en compensant cette rotation
  // = la flèche rouge pointe vers le haut quand on marche vers le Nord
  
  const rotation = heading ?? 0

  return (
    <div style={{
      position: 'absolute', bottom: 70, right: 68,
      zIndex: 650, pointerEvents: 'none',
      width: 52, height: 52,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'rgba(5,12,24,0.92)',
        border: '1px solid rgba(0,245,212,0.2)',
        boxShadow: '0 0 12px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* N fixe en haut */}
        <div style={{
          position: 'absolute', top: 4, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold',
          color: '#ef4444',
        }}>N</div>

        {/* Aiguille qui pointe vers le vrai Nord */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: 2, height: 26,
          transformOrigin: 'center center',
          transition: 'transform 0.4s ease',
        }}>
          {/* Pointe rouge = Nord */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,#ef4444,#991b1b)', borderRadius: '2px 2px 0 0' }} />
          {/* Pointe blanche = Sud */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'rgba(255,255,255,0.6)', borderRadius: '0 0 2px 2px' }} />
        </div>

        {/* Centre */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 5, height: 5, borderRadius: '50%', background: '#00f5d4', zIndex: 1 }} />
      </div>

      {/* Indication cap */}
      <div style={{
        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
        fontSize: 8, fontFamily: 'monospace', color: 'rgba(0,245,212,0.7)',
        letterSpacing: '0.05em', whiteSpace: 'nowrap',
      }}>
        {heading !== null ? `${Math.round(heading)}°` : '—'}
      </div>
    </div>
  )
}
