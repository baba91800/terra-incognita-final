// Notifications push PWA — rappel quotidien streak

const NOTIF_PERMISSION_KEY = 'ti2_notif_asked'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  localStorage.setItem(NOTIF_PERMISSION_KEY, result)
  return result === 'granted'
}

export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function hasAskedPermission(): boolean {
  return !!localStorage.getItem(NOTIF_PERMISSION_KEY)
}

// Programmer un rappel quotidien via le Service Worker
export async function scheduleStreakReminder(): Promise<void> {
  if (!hasNotificationPermission()) return
  if (!('serviceWorker' in navigator)) return

  try {
    const reg = await navigator.serviceWorker.ready

    // Vérifier si l'API de sync périodique est dispo (Chrome Android)
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as any })
      if (status.state === 'granted') {
        await (reg as any).periodicSync.register('streak-reminder', { minInterval: 24 * 60 * 60 * 1000 })
        return
      }
    }

    // Fallback : programmer via setTimeout pour la session courante
    scheduleLocalReminder()
  } catch {}
}

// Rappel dans la session courante si l'utilisateur garde l'app ouverte
function scheduleLocalReminder() {
  const lastDay = localStorage.getItem('ti2_last_day') || ''
  const today = new Date().toISOString().split('T')[0]
  if (lastDay === today) return // Déjà exploré aujourd'hui

  // Notif immédiate si pas exploré aujourd'hui
  const streak = parseInt(localStorage.getItem('ti2_streak') || '0')
  if (streak > 0) {
    setTimeout(() => {
      sendLocalNotification(
        'Terra Incognita 🌍',
        streak > 1
          ? `Tu as une série de ${streak} jours ! Explore aujourd'hui pour la garder 🔥`
          : `Commence à explorer pour lancer ta série ! 🗺️`,
      )
    }, 3000) // 3s après l'ouverture
  }
}

export function sendLocalNotification(title: string, body: string): void {
  if (!hasNotificationPermission()) return
  try {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'terra-streak',
      renotify: false,
    })
  } catch {}
}
