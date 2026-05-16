'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Monument, Notification, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '@/types/game'
import {
  REVEAL_RADIUS_METERS,
  MONUMENT_DISCOVER_RADIUS_METERS,
  MOVE_STEP_METERS,
  TILE_POINTS,
  RARITY_POINTS,
  COUNTRY_BONUS_MAP,
  getLevelFromXP,
  LEVEL_TITLES,
  generateDailyObjectives,
  todayString,
} from '@/lib/constants'
import { distanceMeters, tilesInRadius, movePosition } from '@/lib/geo'
import {
  loadTiles, saveTiles,
  loadScore, saveScore,
  loadXP, saveXP,
  loadLevel, saveLevel,
  loadDistance, saveDistance,
  loadBadges, saveBadges,
  loadMonuments, saveMonuments,
  loadPlayer, savePlayer,
  loadCountries, saveCountries,
  loadObjectives, saveObjectives,
  loadLog, saveLog,
  loadPath, savePath,
} from '@/lib/storage'

export function useGameEngine() {
  const [playerLat, setPlayerLat] = useState(48.8566)
  const [playerLng, setPlayerLng] = useState(2.3522)
  const [score, setScore] = useState(0)
  const [xp, setXP] = useState(0)
  const [level, setLevel] = useState(1)
  const [xpIntoLevel, setXpIntoLevel] = useState(0)
  const [xpForNext, setXpForNext] = useState(500)
  const [levelTitle, setLevelTitle] = useState('Novice')
  const [badges, setBadges] = useState<Badge[]>([])
  const [monuments, setMonuments] = useState<Monument[]>([])
  const [countries, setCountries] = useState<CountryDiscovery[]>([])
  const [objectives, setObjectives] = useState<DailyObjective[]>([])
  const [discoveryLog, setDiscoveryLog] = useState<DiscoveryLog[]>([])
  const [explorationPath, setExplorationPath] = useState<ExplorationPath[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [gpsActive, setGpsActive] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [totalDistance, setTotalDistance] = useState(0)

  // Refs for synchronous access
  const discoveredTiles = useRef<Set<string>>(new Set())
  const scoreRef = useRef(0)
  const xpRef = useRef(0)
  const levelRef = useRef(1)
  const badgesRef = useRef<Badge[]>([])
  const gpsWatchId = useRef<number | null>(null)
  const playerLatRef = useRef(48.8566)
  const playerLngRef = useRef(2.3522)
  const monumentsRef = useRef<Monument[]>([])
  const countriesRef = useRef<CountryDiscovery[]>([])
  const discoveredCountryCodes = useRef<Set<string>>(new Set())
  const objectivesRef = useRef<DailyObjective[]>([])
  const logRef = useRef<DiscoveryLog[]>([])
  const pathRef = useRef<ExplorationPath[]>([])
  const distanceRef = useRef(0)
  const dailyTilesRef = useRef(0)
  const dailyMonumentsRef = useRef(0)
  const dailyCountriesRef = useRef(0)
  const dailyScoreRef = useRef(0)
  const dailyDistanceRef = useRef(0)

  // ── Notification ─────────────────────────────────────────
  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random()
    setNotifications(prev => [...prev.slice(-4), { ...n, id }])
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== id)), 4500)
  }, [])

  // ── Discovery Log ─────────────────────────────────────────
  const addLog = useCallback((entry: Omit<DiscoveryLog, 'id' | 'timestamp'>) => {
    const log: DiscoveryLog = {
      ...entry,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString(),
    }
    logRef.current = [log, ...logRef.current].slice(0, 100)
    setDiscoveryLog([...logRef.current])
    saveLog(logRef.current)
  }, [])

  // ── XP & Level ────────────────────────────────────────────
  const addXP = useCallback((amount: number, source?: string) => {
    xpRef.current += amount
    const { level: newLevel, xpIntoLevel: into, xpForNext: forNext } = getLevelFromXP(xpRef.current)

    if (newLevel > levelRef.current) {
      levelRef.current = newLevel
      saveLevel(newLevel)
      const title = LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)]
      setLevelTitle(title)
      notify({ type: 'level', title: `Level ${newLevel}`, subtitle: title, points: 0, icon: '🎖️' })
      addLog({ type: 'level', title: `Level ${newLevel} — ${title}`, icon: '🎖️' })
    }

    setXP(xpRef.current)
    setLevel(levelRef.current)
    setXpIntoLevel(into)
    setXpForNext(forNext)
    saveXP(xpRef.current)
  }, [notify, addLog])

  // ── Objectives ────────────────────────────────────────────
  const updateObjectives = useCallback((type: DailyObjective['type'], increment: number) => {
    let changed = false
    const updated = objectivesRef.current.map(obj => {
      if (obj.type !== type || obj.completed) return obj
      const newCurrent = Math.min(obj.current + increment, obj.target)
      if (newCurrent >= obj.target && !obj.completed) {
        changed = true
        addXP(obj.reward, 'objective')
        scoreRef.current += obj.reward
        setScore(scoreRef.current)
        saveScore(scoreRef.current)
        notify({ type: 'objective', title: 'Objective Complete!', subtitle: obj.description, points: obj.reward, icon: obj.icon })
        addLog({ type: 'objective', title: obj.description, icon: obj.icon, points: obj.reward })
        return { ...obj, current: newCurrent, completed: true }
      }
      if (newCurrent !== obj.current) changed = true
      return { ...obj, current: newCurrent }
    })
    if (changed) {
      objectivesRef.current = updated
      setObjectives([...updated])
      saveObjectives(updated)
    }
  }, [notify, addLog, addXP])

  // ── Badge Check ───────────────────────────────────────────
  const checkBadges = useCallback((tiles: Set<string>, score: number, monuments: Monument[]) => {
    const dm = monuments.filter(m => m.discovered)
    const checks: Array<{ id: string; condition: boolean }> = [
      { id: 'b1',  condition: tiles.size >= 10 },
      { id: 'b10', condition: tiles.size >= 200 },
      { id: 'b2',  condition: tiles.size >= 500 },
      { id: 'b3',  condition: tiles.size >= 2000 },
      { id: 'b4',  condition: dm.length >= 1 },
      { id: 'b5',  condition: dm.length >= 5 },
      { id: 'b6',  condition: dm.length >= 10 },
      { id: 'b7',  condition: dm.some(m => m.rarity === 'legendary') },
      { id: 'b8',  condition: score >= 5000 },
      { id: 'b9',  condition: dm.some(m => m.rarity === 'epic') },
    ]
    let changed = false
    const newBadges = badgesRef.current.map(b => {
      const check = checks.find(c => c.id === b.id)
      if (check && check.condition && !b.earned) {
        changed = true
        const updated = { ...b, earned: true, earnedAt: new Date().toISOString() }
        notify({ type: 'badge', title: b.name, subtitle: b.description, points: 0, icon: b.icon })
        addLog({ type: 'badge', title: b.name, subtitle: b.description, icon: b.icon })
        return updated
      }
      return b
    })
    if (changed) {
      badgesRef.current = newBadges
      setBadges([...newBadges])
      saveBadges(newBadges)
    }
  }, [notify, addLog])

  // ── Path tracking ─────────────────────────────────────────
  const trackPath = useCallback((lat: number, lng: number) => {
    const point: ExplorationPath = { lat, lng, timestamp: Date.now() }
    pathRef.current = [...pathRef.current, point].slice(-500)
    setExplorationPath([...pathRef.current])
    // Save every 10 points
    if (pathRef.current.length % 10 === 0) savePath(pathRef.current)
  }, [])

  // ── Reveal tiles ─────────────────────────────────────────
  const revealAt = useCallback((lat: number, lng: number, currentMonuments: Monument[]) => {
    const keys = tilesInRadius(lat, lng, REVEAL_RADIUS_METERS)
    const newKeys = keys.filter(k => !discoveredTiles.current.has(k))

    if (newKeys.length > 0) {
      newKeys.forEach(k => discoveredTiles.current.add(k))
      const pts = newKeys.length * TILE_POINTS
      scoreRef.current += pts
      xpRef.current += pts
      dailyTilesRef.current += newKeys.length
      dailyScoreRef.current += pts

      setScore(scoreRef.current)
      addXP(0) // trigger level check without double-adding
      xpRef.current -= pts // addXP already added, correct
      xpRef.current += pts

      saveTiles(discoveredTiles.current)
      saveScore(scoreRef.current)
      updateObjectives('tiles', newKeys.length)
      updateObjectives('score', pts)
    }

    // Monument detection
    const updatedMonuments = currentMonuments.map(m => {
      if (m.discovered) return m
      const dist = distanceMeters(lat, lng, m.lat, m.lng)
      if (dist <= MONUMENT_DISCOVER_RADIUS_METERS) {
        const pts = RARITY_POINTS[m.rarity]
        scoreRef.current += pts
        xpRef.current += pts
        dailyScoreRef.current += pts
        dailyMonumentsRef.current += 1
        setScore(scoreRef.current)
        addXP(0)
        xpRef.current -= pts
        addXP(pts)
        saveScore(scoreRef.current)
        notify({ type: 'monument', title: m.name, subtitle: m.type, points: pts, rarity: m.rarity })
        addLog({ type: 'monument', title: m.name, subtitle: m.type, icon: m.type === 'museum' ? '🏛️' : m.type === 'cathedral' ? '⛪' : '🗺️', points: pts, rarity: m.rarity })
        updateObjectives('monuments', 1)
        updateObjectives('score', pts)
        return { ...m, discovered: true, discoveredAt: new Date().toISOString() }
      }
      return m
    })

    const changed = updatedMonuments.some((m, i) => m.discovered !== currentMonuments[i].discovered)
    if (changed) {
      setMonuments([...updatedMonuments])
      saveMonuments(updatedMonuments)
      checkBadges(discoveredTiles.current, scoreRef.current, updatedMonuments)
      return updatedMonuments
    }

    if (newKeys.length > 0) checkBadges(discoveredTiles.current, scoreRef.current, currentMonuments)
    return currentMonuments
  }, [notify, addLog, addXP, checkBadges, updateObjectives])

  // ── Country detection ─────────────────────────────────────
  const lastGeocodedPos = useRef('')
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detectCountry = useCallback((lat: number, lng: number) => {
    const posKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
    if (posKey === lastGeocodedPos.current) return
    lastGeocodedPos.current = posKey
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current)
    geocodeTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        const code = data?.address?.country_code?.toUpperCase()
        if (!code || discoveredCountryCodes.current.has(code)) return
        const bonus = COUNTRY_BONUS_MAP[code]
        if (!bonus) return
        discoveredCountryCodes.current.add(code)
        const discovery: CountryDiscovery = { code, name: bonus.name, flag: bonus.flag, rarity: bonus.rarity, points: bonus.points, discoveredAt: new Date().toISOString() }
        countriesRef.current = [...countriesRef.current, discovery]
        setCountries([...countriesRef.current])
        saveCountries(countriesRef.current)
        scoreRef.current += bonus.points
        setScore(scoreRef.current)
        saveScore(scoreRef.current)
        addXP(bonus.points)
        dailyCountriesRef.current += 1
        notify({ type: 'country', title: `${bonus.flag} ${bonus.name}`, subtitle: bonus.reason, points: bonus.points, rarity: bonus.rarity })
        addLog({ type: 'country', title: bonus.name, subtitle: bonus.reason, icon: bonus.flag, points: bonus.points, rarity: bonus.rarity })
        updateObjectives('countries', 1)
        updateObjectives('score', bonus.points)
      } catch {}
    }, 1500)
  }, [notify, addLog, addXP, updateObjectives])

  // ── Daily objectives init ─────────────────────────────────
  const initObjectives = useCallback(() => {
    const today = todayString()
    const saved = loadObjectives()
    if (saved.length > 0 && saved[0].date === today) {
      objectivesRef.current = saved
      setObjectives(saved)
    } else {
      const fresh = generateDailyObjectives(today)
      objectivesRef.current = fresh
      setObjectives(fresh)
      saveObjectives(fresh)
      // Reset daily counters
      dailyTilesRef.current = 0
      dailyMonumentsRef.current = 0
      dailyCountriesRef.current = 0
      dailyScoreRef.current = 0
      dailyDistanceRef.current = 0
    }
  }, [])

  // ── Init ─────────────────────────────────────────────────
  useEffect(() => {
    const tiles = loadTiles()
    const savedScore = loadScore()
    const savedXP = loadXP()
    const savedBadges = loadBadges()
    const savedMonuments = loadMonuments()
    const savedPlayer = loadPlayer()
    const savedCountries = loadCountries()
    const savedLog = loadLog()
    const savedPath = loadPath()
    const savedDist = loadDistance()

    discoveredTiles.current = tiles
    scoreRef.current = savedScore
    xpRef.current = savedXP
    badgesRef.current = savedBadges
    countriesRef.current = savedCountries
    logRef.current = savedLog
    pathRef.current = savedPath
    distanceRef.current = savedDist
    savedCountries.forEach(c => discoveredCountryCodes.current.add(c.code))

    const { level: lv, xpIntoLevel: into, xpForNext: forNext } = getLevelFromXP(savedXP)
    levelRef.current = lv

    setScore(savedScore)
    setXP(savedXP)
    setLevel(lv)
    setXpIntoLevel(into)
    setXpForNext(forNext)
    setLevelTitle(LEVEL_TITLES[Math.min(lv - 1, LEVEL_TITLES.length - 1)])
    setBadges(savedBadges)
    setMonuments(savedMonuments)
    setCountries(savedCountries)
    setDiscoveryLog(savedLog)
    setExplorationPath(savedPath)
    setTotalDistance(savedDist)
    setPlayerLat(savedPlayer.lat)
    setPlayerLng(savedPlayer.lng)
    playerLatRef.current = savedPlayer.lat
    playerLngRef.current = savedPlayer.lng

    initObjectives()
    setInitialized(true)
  }, [initObjectives])

  // ── Move ─────────────────────────────────────────────────
  useEffect(() => { playerLatRef.current = playerLat }, [playerLat])
  useEffect(() => { playerLngRef.current = playerLng }, [playerLng])
  useEffect(() => { monumentsRef.current = monuments }, [monuments])

  const moveDirect = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
    const prevLat = playerLatRef.current
    const prevLng = playerLngRef.current
    const { lat: newLat, lng: newLng } = movePosition(prevLat, prevLng, direction, MOVE_STEP_METERS)

    // Distance tracking
    const dist = distanceMeters(prevLat, prevLng, newLat, newLng)
    distanceRef.current += dist
    dailyDistanceRef.current += dist
    setTotalDistance(distanceRef.current)
    saveDistance(distanceRef.current)
    updateObjectives('distance', dist)

    playerLatRef.current = newLat
    playerLngRef.current = newLng
    setPlayerLat(newLat)
    setPlayerLng(newLng)
    savePlayer(newLat, newLng)
    trackPath(newLat, newLng)

    const updated = revealAt(newLat, newLng, monumentsRef.current)
    monumentsRef.current = updated
    detectCountry(newLat, newLng)
  }, [revealAt, detectCountry, trackPath, updateObjectives])

  // ── GPS ──────────────────────────────────────────────────
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsActive(true)
    gpsWatchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        const dist = distanceMeters(playerLatRef.current, playerLngRef.current, latitude, longitude)
        if (dist < 2) return // ignore GPS jitter under 2m
        distanceRef.current += dist
        dailyDistanceRef.current += dist
        setTotalDistance(distanceRef.current)
        saveDistance(distanceRef.current)
        updateObjectives('distance', dist)
        playerLatRef.current = latitude
        playerLngRef.current = longitude
        setPlayerLat(latitude)
        setPlayerLng(longitude)
        savePlayer(latitude, longitude)
        trackPath(latitude, longitude)
        const updated = revealAt(latitude, longitude, monumentsRef.current)
        monumentsRef.current = updated
        detectCountry(latitude, longitude)
      },
      err => { console.warn('GPS:', err); setGpsActive(false) },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }, [revealAt, detectCountry, trackPath, updateObjectives])

  const stopGPS = useCallback(() => {
    if (gpsWatchId.current !== null) { navigator.geolocation.clearWatch(gpsWatchId.current); gpsWatchId.current = null }
    setGpsActive(false)
  }, [])

  // ── Keyboard ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      switch (e.key) {
        case 'ArrowUp':    moveDirect('north'); break
        case 'ArrowDown':  moveDirect('south'); break
        case 'ArrowLeft':  moveDirect('west');  break
        case 'ArrowRight': moveDirect('east');  break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [moveDirect])

  // ── Initial reveal ────────────────────────────────────────
  useEffect(() => {
    if (initialized && monuments.length > 0) {
      revealAt(playerLatRef.current, playerLngRef.current, monumentsRef.current)
      detectCountry(playerLatRef.current, playerLngRef.current)
    }
  }, [initialized]) // eslint-disable-line

  const totalTiles = discoveredTiles.current.size
  const explorationPercent = Math.min(100, (totalTiles / 10000) * 100).toFixed(1)

  return {
    playerLat, playerLng,
    score, xp, level, xpIntoLevel, xpForNext, levelTitle,
    badges, monuments, countries,
    objectives, discoveryLog, explorationPath,
    notifications, gpsActive, initialized,
    discoveredTiles: discoveredTiles.current,
    totalTiles, explorationPercent,
    totalDistance,
    moveDirect, startGPS, stopGPS,
  }
}
