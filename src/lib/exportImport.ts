// Export / Import de toutes les données Terra Incognita

const EXPORT_VERSION = 1

const ALL_KEYS = [
  'ti2_tiles', 'ti2_score', 'ti2_xp', 'ti2_dist',
  'ti2_badges', 'ti2_monuments', 'ti2_player',
  'ti2_countries', 'ti2_obj', 'ti2_log', 'ti2_path',
  'ti2_markers', 'ti2_territory_data',
  'ti2_avatar', 'ti2_avatar_photo', 'ti2_pseudo',
  'ti2_streak', 'ti2_last_day', 'ti2_lang',
]

export interface ExportData {
  version: number
  exportedAt: string
  data: Record<string, string | null>
}

export function exportData(): void {
  const data: Record<string, string | null> = {}
  ALL_KEYS.forEach(key => {
    try { data[key] = localStorage.getItem(key) } catch { data[key] = null }
  })

  const payload: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `terra-incognita-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string
        const payload: ExportData = JSON.parse(raw)

        if (!payload.version || !payload.data) {
          resolve({ success: false, message: 'Fichier invalide ou corrompu.' })
          return
        }

        if (payload.version > EXPORT_VERSION) {
          resolve({ success: false, message: 'Version trop récente. Mets à jour l\'application.' })
          return
        }

        // Restaurer toutes les clés
        let restored = 0
        Object.entries(payload.data).forEach(([key, value]) => {
          try {
            if (value !== null) { localStorage.setItem(key, value); restored++ }
            else localStorage.removeItem(key)
          } catch {}
        })

        resolve({
          success: true,
          message: `Données restaurées (${restored} entrées). L'app va redémarrer.`,
        })
      } catch {
        resolve({ success: false, message: 'Fichier JSON invalide.' })
      }
    }
    reader.onerror = () => resolve({ success: false, message: 'Erreur de lecture du fichier.' })
    reader.readAsText(file)
  })
}

export function getDataSummary(): { tiles: number; score: number; monuments: number; exportedAt?: string } {
  try {
    const tiles = JSON.parse(localStorage.getItem('ti2_tiles') || '[]').length
    const score = parseInt(localStorage.getItem('ti2_score') || '0')
    const monuments = JSON.parse(localStorage.getItem('ti2_monuments') || '[]').filter((m: any) => m.discovered).length
    return { tiles, score, monuments }
  } catch {
    return { tiles: 0, score: 0, monuments: 0 }
  }
}
