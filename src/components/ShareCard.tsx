import { useRef, useEffect, useState } from 'react'

interface Props {
  tiles: Set<string>
  playerLat: number
  playerLng: number
  score: number
  level: number
  levelTitle: string
  totalDist: number
  monuments: Array<{ discovered: boolean; rarity: string }>
  pseudo: string
  avatar: string
  avatarPhoto?: string
  onClose: () => void
}

export default function ShareCard({ tiles, playerLat, playerLng, score, level, levelTitle, totalDist, monuments, pseudo, avatar, avatarPhoto, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 800, H = 440
    canvas.width = W; canvas.height = H

    // ── Fond ──
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#020810')
    bg.addColorStop(1, '#040f1f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // ── Grille de fond ──
    ctx.strokeStyle = 'rgba(0,245,212,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // ── Minimap des tuiles (droite) ──
    const MPL = 111320
    const TILE_SIZE = 10
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)
    const coords: { tx: number; ty: number }[] = []
    tiles.forEach(k => { const [tx, ty] = k.split(':').map(Number); coords.push({ tx, ty }) })

    if (coords.length > 0) {
      const minTx = Math.min(...coords.map(c => c.tx))
      const maxTx = Math.max(...coords.map(c => c.tx))
      const minTy = Math.min(...coords.map(c => c.ty))
      const maxTy = Math.max(...coords.map(c => c.ty))
      const spanX = Math.max(1, maxTx - minTx + 1)
      const spanY = Math.max(1, maxTy - minTy + 1)

      const mapW = 300, mapH = 300
      const mapX = W - mapW - 40
      const mapY = (H - mapH) / 2
      const scale = Math.min(mapW / spanX, mapH / spanY, 6)
      const ox = mapX + (mapW - spanX * scale) / 2
      const oy = mapY + (mapH - spanY * scale) / 2

      // Halo de la carte
      const mapGlow = ctx.createRadialGradient(mapX + mapW / 2, mapY + mapH / 2, 0, mapX + mapW / 2, mapY + mapH / 2, mapW * 0.7)
      mapGlow.addColorStop(0, 'rgba(0,245,212,0.06)')
      mapGlow.addColorStop(1, 'rgba(0,245,212,0)')
      ctx.fillStyle = mapGlow
      ctx.fillRect(mapX - 40, mapY - 40, mapW + 80, mapH + 80)

      // Tuiles
      coords.forEach(({ tx, ty }) => {
        const x = ox + (tx - minTx) * scale
        const y = oy + (maxTy - ty) * scale
        ctx.fillStyle = 'rgba(0,245,212,0.45)'
        ctx.fillRect(x, y, Math.max(1.5, scale), Math.max(1.5, scale))
      })

      // Point joueur
      const px = Math.floor(playerLng * MPG / TILE_SIZE)
      const py = Math.floor(playerLat * MPL / TILE_SIZE)
      const ppx = ox + (px - minTx) * scale + scale / 2
      const ppy = oy + (maxTy - py) * scale + scale / 2
      const pg = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, 12)
      pg.addColorStop(0, 'rgba(0,245,212,0.8)'); pg.addColorStop(1, 'rgba(0,245,212,0)')
      ctx.beginPath(); ctx.arc(ppx, ppy, 12, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill()
      ctx.beginPath(); ctx.arc(ppx, ppy, 5, 0, Math.PI * 2); ctx.fillStyle = '#00f5d4'; ctx.fill()
      ctx.beginPath(); ctx.arc(ppx, ppy, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    }

    // ── Ligne de séparation ──
    const lineX = W - 360
    const lineGrad = ctx.createLinearGradient(lineX, 0, lineX, H)
    lineGrad.addColorStop(0, 'rgba(0,245,212,0)')
    lineGrad.addColorStop(0.3, 'rgba(0,245,212,0.15)')
    lineGrad.addColorStop(0.7, 'rgba(0,245,212,0.15)')
    lineGrad.addColorStop(1, 'rgba(0,245,212,0)')
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(lineX, 0); ctx.lineTo(lineX, H); ctx.stroke()

    // ── Contenu gauche ──
    const lx = 40

    // Logo
    ctx.fillStyle = 'rgba(0,245,212,0.08)'
    ctx.strokeStyle = 'rgba(0,245,212,0.2)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(lx + 22, 50, 22, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'
    ctx.fillText(avatarPhoto ? '📸' : avatar, lx + 22, 58)

    // Pseudo
    ctx.textAlign = 'left'
    ctx.font = 'bold 22px monospace'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(pseudo, lx + 54, 46)
    ctx.font = '12px monospace'
    ctx.fillStyle = 'rgba(0,245,212,0.7)'
    ctx.fillText(`Niveau ${level} · ${levelTitle}`, lx + 54, 65)

    // Score
    ctx.font = 'bold 52px monospace'
    ctx.fillStyle = '#00f5d4'
    ctx.fillText(score.toLocaleString(), lx, 150)
    ctx.font = '11px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('EXPLORER POINTS', lx, 170)

    // Stats grid
    const stats = [
      { icon: '🗺️', label: 'Surface', value: `${(tiles.size * 100).toLocaleString()} m²` },
      { icon: '👟', label: 'Distance', value: `${(totalDist / 1000).toFixed(2)} km` },
      { icon: '🏛️', label: 'Sites', value: monuments.filter(m => m.discovered).length.toString() },
      { icon: '⚡', label: 'Tuiles', value: tiles.size.toLocaleString() },
    ]
    stats.forEach((s, i) => {
      const sx = lx + (i % 2) * 150
      const sy = 210 + Math.floor(i / 2) * 65
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      roundRect(ctx, sx, sy, 130, 50, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      roundRect(ctx, sx, sy, 130, 50, 8)
      ctx.stroke()
      ctx.font = '13px serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'
      ctx.fillText(s.icon, sx + 10, sy + 22)
      ctx.font = 'bold 15px monospace'; ctx.fillStyle = '#ffffff'
      ctx.fillText(s.value, sx + 32, sy + 22)
      ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillText(s.label.toUpperCase(), sx + 32, sy + 38)
    })

    // Branding
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.textAlign = 'left'
    ctx.fillText('TERRA INCOGNITA · Explore the World', lx, H - 20)

    // Date
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillText(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), W - 40, H - 20)

    setGenerating(false)
    setImageUrl(canvas.toDataURL('image/png'))
  }, [])

  const handleShare = async () => {
    if (!imageUrl) return
    try {
      const blob = await (await fetch(imageUrl)).blob()
      const file = new File([blob], 'terra-incognita.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Terra Incognita', text: `J'ai exploré ${tiles.size * 100} m² ! Score : ${score.toLocaleString()} pts` })
      } else {
        // Fallback : télécharger
        const a = document.createElement('a')
        a.href = imageUrl; a.download = 'terra-incognita.png'; a.click()
      }
    } catch {}
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(2,5,15,0.95)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
        Partager mon exploration
      </div>

      {/* Preview */}
      <div style={{ width: '100%', maxWidth: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,245,212,0.2)', boxShadow: '0 0 40px rgba(0,0,0,0.8)', marginBottom: 20 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {!generating && (
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 500 }}>
          <button onClick={handleShare} style={{
            flex: 2, padding: '13px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg,#00b4a0,#00f5d4)',
            border: 'none', color: '#030810', fontSize: 14, fontWeight: 'bold',
            fontFamily: 'monospace', boxShadow: '0 0 20px rgba(0,245,212,0.3)',
          }}>
            📤 Partager / Télécharger
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'monospace',
          }}>Fermer</button>
        </div>
      )}
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
