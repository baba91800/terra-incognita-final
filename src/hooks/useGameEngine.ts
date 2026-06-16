import { useCallback, useEffect, useRef, useState } from 'react'
import type { Badge, Monument, Notification, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '../types/game'
import { REVEAL_RADIUS, MONUMENT_RADIUS, TILE_POINTS, RARITY_POINTS, COUNTRY_MAP, getLevelFromXP, LEVEL_TITLES, genObjectives, todayStr, DEFAULT_BADGES } from '../lib/constants'
import { dist, tilesInRadius, movePos } from '../lib/geo'
import { saveTiles,loadTiles,saveScore,loadScore,saveXP,loadXP,saveDist,loadDist,saveBadges,loadBadges,saveMonuments,loadMonuments,savePlayer,loadPlayer,saveCountries,loadCountries,saveObjectives,loadObjectives,saveLog,loadLog,savePath,loadPath } from '../lib/storage'
import { fetchMonuments } from '../lib/overpass'
import { fetchTerritory, loadTerritory, type TerritoryData, updateCityTiles } from '../lib/territory'
import { loadWeeklyObjectives, saveWeeklyObjectives } from '../lib/weeklyObjectives'

export function useGameEngine() {
  const [playerLat,setPlayerLat]=useState(48.8566)
  const [playerLng,setPlayerLng]=useState(2.3522)
  const [score,setScore]=useState(0)
  const [xp,setXP]=useState(0)
  const [level,setLevel]=useState(1)
  const [xpIntoLevel,setXpIntoLevel]=useState(0)
  const [xpForNext,setXpForNext]=useState(500)
  const [levelTitle,setLevelTitle]=useState('Novice')
  const [badges,setBadges]=useState<Badge[]>([])
  const [monuments,setMonuments]=useState<Monument[]>([])
  const [countries,setCountries]=useState<CountryDiscovery[]>([])
  const [objectives,setObjectives]=useState<DailyObjective[]>([])
  const [log,setLog]=useState<DiscoveryLog[]>([])
  const [path,setPath]=useState<ExplorationPath[]>([])
  const [notifications,setNotifications]=useState<Notification[]>([])
  const [gpsActive,setGpsActive]=useState(false)
  const [gpsHeading,setGpsHeading]=useState<number|null>(null)
  const [initialized,setInitialized]=useState(false)
  const [totalDist,setTotalDist]=useState(0)
  const [territory,setTerritory]=useState<TerritoryData>({city:null,department:null,country:null,lastUpdated:''})

  const tiles=useRef<Set<string>>(new Set())
  const scoreR=useRef(0); const xpR=useRef(0); const levelR=useRef(1)
  const latR=useRef(48.8566); const lngR=useRef(2.3522)
  const monR=useRef<Monument[]>([]); const countriesR=useRef<CountryDiscovery[]>([])
  const badgesR=useRef<Badge[]>([]); const objR=useRef<DailyObjective[]>([])
  const logR=useRef<DiscoveryLog[]>([]); const pathR=useRef<ExplorationPath[]>([])
  const distR=useRef(0); const gpsId=useRef<number|null>(null)
  const weeklyR=useRef(loadWeeklyObjectives())
  const discovCodes=useRef<Set<string>>(new Set())
  const lastGeoKey=useRef(''); const geoTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const smoothedHeading=useRef<number|null>(null)
  const lastFetchKey=useRef('')

  // Feedback haptique et sonore
  const hapticFeedback = useCallback((type: 'monument'|'badge'|'level'|'tile') => {
    if (!navigator.vibrate) return
    switch(type) {
      case 'monument': navigator.vibrate([50, 30, 100]); break
      case 'badge':    navigator.vibrate([100, 50, 100, 50, 200]); break
      case 'level':    navigator.vibrate([200, 100, 200]); break
      case 'tile':     navigator.vibrate(10); break
    }
  }, [])

  const notify=useCallback((n:Omit<Notification,'id'>)=>{
    const id=Date.now()+Math.random()+''
    setNotifications(p=>[...p.slice(-4),{...n,id}])
    setTimeout(()=>setNotifications(p=>p.filter(x=>x.id!==id)),4500)
  },[])

  const addLog=useCallback((e:Omit<DiscoveryLog,'id'|'timestamp'>)=>{
    const entry:DiscoveryLog={...e,id:Date.now()+Math.random()+'',timestamp:new Date().toISOString()}
    logR.current=[entry,...logR.current].slice(0,100)
    setLog([...logR.current]); saveLog(logR.current)
  },[])

  const applyXP=useCallback((amount:number)=>{
    xpR.current+=amount
    const {level:lv,xpIntoLevel:into,xpForNext:fn}=getLevelFromXP(xpR.current)
    if(lv>levelR.current){
      levelR.current=lv
      const title=LEVEL_TITLES[Math.min(lv-1,LEVEL_TITLES.length-1)]
      setLevelTitle(title)
      notify({type:'level',title:`Level ${lv}`,subtitle:title,points:0,icon:'🎖️'})
      hapticFeedback('level')
      addLog({type:'level',title:`Level ${lv} — ${title}`,icon:'🎖️'})
    }
    setXP(xpR.current); setLevel(levelR.current)
    setXpIntoLevel(into); setXpForNext(fn); saveXP(xpR.current)
  },[notify,addLog])

  const updateWeekly=useCallback((type:string,inc:number)=>{
    let changed=false
    const updated=weeklyR.current.map(o=>{
      if(o.type!==type||o.completed) return o
      const cur=Math.min(o.current+inc,o.target)
      if(cur>=o.target&&!o.completed){
        changed=true
        applyXP(o.reward); scoreR.current+=o.reward; setScore(scoreR.current); saveScore(scoreR.current)
        notify({type:'objective',title:'Objectif semaine !',subtitle:o.description,points:o.reward,icon:o.icon})
        return {...o,current:cur,completed:true}
      }
      if(cur!==o.current) changed=true
      return {...o,current:cur}
    })
    if(changed){weeklyR.current=updated;saveWeeklyObjectives(updated)}
  },[applyXP,notify])

  const updateObj=useCallback((type:DailyObjective['type'],inc:number)=>{
    let changed=false
    const updated=objR.current.map(o=>{
      if(o.type!==type||o.completed) return o
      const cur=Math.min(o.current+inc,o.target)
      if(cur>=o.target&&!o.completed){
        changed=true
        applyXP(o.reward); scoreR.current+=o.reward; setScore(scoreR.current); saveScore(scoreR.current)
        notify({type:'objective',title:'Objective Complete!',subtitle:o.description,points:o.reward,icon:o.icon})
        addLog({type:'objective',title:o.description,icon:o.icon,points:o.reward})
        return {...o,current:cur,completed:true}
      }
      if(cur!==o.current) changed=true
      return {...o,current:cur}
    })
    if(changed){objR.current=updated;setObjectives([...updated]);saveObjectives(updated)}
  },[applyXP,notify,addLog])

  const checkBadges=useCallback((ms:Monument[])=>{
    const dm=ms.filter(m=>m.discovered)
    const naturalTypes = ['volcano','glacier','peak','cave','waterfall','hot_spring','park','reserve','spring','tree','cliff','gorge','arch','cape','rock','beach']
    const epicHistoric = dm.filter(m=>m.rarity==='epic' && ['castle','fort','ruins','megalith','palace','cathedral'].includes(m.type))
    const naturalSites = dm.filter(m=>naturalTypes.includes(m.type))
    const legendaryCount = dm.filter(m=>m.rarity==='legendary').length

    // Streak — check localStorage for last exploration date
    const lastDay = localStorage.getItem('ti2_last_day') || ''
    const today = new Date().toISOString().split('T')[0]
    let streak = parseInt(localStorage.getItem('ti2_streak') || '0')
    if (tiles.current.size > 0) {
      if (lastDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        streak = lastDay === yesterday ? streak + 1 : 1
        localStorage.setItem('ti2_streak', String(streak))
        localStorage.setItem('ti2_last_day', today)
      }
    }

    // Calculs supplémentaires pour nouveaux badges
    const caves = dm.filter(m=>m.type==='cave')
    const peaks = dm.filter(m=>m.type==='peak')
    const lighthouses = dm.filter(m=>m.type==='lighthouse')
    const windmills = dm.filter(m=>m.type==='windmill')
    const km2 = tiles.current.size * 0.0001 // chaque tuile = 100m² = 0.0001 km²
    const hasEpicCountry = countriesR.current.some(c=>c.rarity==='epic')
    const hasLegendaryCountry = countriesR.current.some(c=>c.rarity==='legendary')
    const hour = new Date().getHours()
    const day = new Date().getDay() // 0=dim, 6=sam
    const lastWeekendKey = 'ti2_weekend'
    const weekendData = JSON.parse(localStorage.getItem(lastWeekendKey)||'{"sat":false,"sun":false}')
    if (day===6) { weekendData.sat=true; localStorage.setItem(lastWeekendKey,JSON.stringify(weekendData)) }
    if (day===0) { weekendData.sun=true; localStorage.setItem(lastWeekendKey,JSON.stringify(weekendData)) }

    // Badges saisonniers
    const month = new Date().getMonth() + 1
    const isWinter = month === 12 || month <= 2
    const isSpring = month >= 3 && month <= 5
    const isSummer = month >= 6 && month <= 8
    const isAutumn = month >= 9 && month <= 11
    const hasGarden = dm.some(m => m.type === 'garden')

    const checks=[
      // Surface
      {id:'b1',  ok: km2>=0.01},
      {id:'b14', ok: km2>=0.1},
      {id:'b2',  ok: km2>=1},
      {id:'b3',  ok: km2>=10},
      {id:'b19', ok: km2>=50},
      // Distance
      {id:'b13', ok: distR.current>=10000},
      {id:'b18', ok: distR.current>=42000},
      {id:'b20', ok: distR.current>=100000},
      // Monuments généraux
      {id:'b4',  ok: dm.length>=1},
      {id:'b5',  ok: dm.length>=5},
      {id:'b6',  ok: dm.length>=10},
      {id:'b7',  ok: legendaryCount>=1},
      {id:'b9',  ok: dm.some(m=>m.rarity==='epic')},
      {id:'b12', ok: legendaryCount>=3},
      // Monuments spécifiques
      {id:'b16', ok: naturalSites.length>=5},
      {id:'b17', ok: epicHistoric.length>=3},
      {id:'b21', ok: caves.length>=3},
      {id:'b22', ok: peaks.length>=3},
      {id:'b23', ok: lighthouses.length>=2},
      {id:'b24', ok: windmills.length>=3},
      // Scores
      {id:'b8',  ok: scoreR.current>=5000},
      {id:'b25', ok: scoreR.current>=10000},
      {id:'b26', ok: scoreR.current>=100000},
      // Pays
      {id:'b10', ok: countriesR.current.length>=3},
      {id:'b11', ok: countriesR.current.length>=5},
      {id:'b27', ok: countriesR.current.length>=10},
      {id:'b28', ok: countriesR.current.length>=20},
      {id:'b29', ok: hasEpicCountry},
      {id:'b30', ok: hasLegendaryCountry},
      // Régularité
      {id:'b15', ok: streak>=7},
      {id:'b31', ok: streak>=30},
      // Temps
      {id:'b32', ok: hour<8 && tiles.current.size>0},
      {id:'b33', ok: hour>=22 && tiles.current.size>0},
      {id:'b34', ok: weekendData.sat && weekendData.sun},
      // Saisonniers
      {id:'bs1', ok: isWinter && tiles.current.size > 0},
      {id:'bs2', ok: isSpring && hasGarden},
      {id:'bs3', ok: isSummer && km2 >= 1},
      {id:'bs4', ok: isAutumn && dm.length > 0},
    ]
    let changed=false
    const nb=badgesR.current.map(b=>{
      const c=checks.find(x=>x.id===b.id)
      if(c&&c.ok&&!b.earned){
        changed=true
        notify({type:'badge',title:b.name,subtitle:b.description,points:0,icon:b.icon})
        hapticFeedback('badge')
        addLog({type:'badge',title:b.name,subtitle:b.description,icon:b.icon})
        return {...b,earned:true,earnedAt:new Date().toISOString()}
      }
      return b
    })
    if(changed){badgesR.current=nb;setBadges([...nb]);saveBadges(nb)}
  },[notify,addLog])

  const revealAt=useCallback((lat:number,lng:number,ms:Monument[])=>{
    const keys=tilesInRadius(lat,lng,REVEAL_RADIUS)
    const newK=keys.filter(k=>!tiles.current.has(k))
    if(newK.length>0){
      newK.forEach(k=>tiles.current.add(k))
      const pts=newK.length*TILE_POINTS
      scoreR.current+=pts; setScore(scoreR.current); saveScore(scoreR.current)
      applyXP(pts); saveTiles(tiles.current)
      updateObj('tiles',newK.length); updateObj('score',pts)
      updateWeekly('tiles',newK.length); updateWeekly('score',pts)
      // Enregistrer les tuiles pour la ville actuelle
      const cityName = territoryR.current?.city
      if (cityName && newK.length > 0) updateCityTiles(cityName, newK.length)
    }
    const updated=ms.map(m=>{
      if(m.discovered) return m
      if(dist(lat,lng,m.lat,m.lng)<=MONUMENT_RADIUS){
        const pts=RARITY_POINTS[m.rarity]
        scoreR.current+=pts; setScore(scoreR.current); saveScore(scoreR.current)
        applyXP(pts); updateObj('monuments',1); updateObj('score',pts)
        updateWeekly('monuments',1); updateWeekly('score',pts)
        notify({type:'monument',title:m.name,subtitle:m.type,points:pts,rarity:m.rarity,icon:m.icon})
        hapticFeedback(m.rarity==='legendary'||m.rarity==='epic'?'monument':'tile')
        addLog({type:'monument',title:m.name,subtitle:m.type,icon:m.icon||'📍',points:pts,rarity:m.rarity})
        return {...m,discovered:true,discoveredAt:new Date().toISOString()}
      }
      return m
    })
    const changed=updated.some((m,i)=>m.discovered!==ms[i].discovered)
    if(changed){monR.current=updated;setMonuments([...updated]);saveMonuments(updated);checkBadges(updated)}
    else if(newK.length>0) checkBadges(ms)
    return changed?updated:ms
  },[applyXP,notify,addLog,checkBadges,updateObj])

  const detectCountry=useCallback((lat:number,lng:number)=>{
    const key=`${lat.toFixed(2)},${lng.toFixed(2)}`
    if(key===lastGeoKey.current) return
    lastGeoKey.current=key
    if(geoTimer.current) clearTimeout(geoTimer.current)
    geoTimer.current=setTimeout(async()=>{
      try {
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,{headers:{'Accept-Language':'en'}})
        const data=await res.json()
        const code=data?.address?.country_code?.toUpperCase()
        if(!code||discovCodes.current.has(code)) return
        const bonus=COUNTRY_MAP[code]; if(!bonus) return
        discovCodes.current.add(code)
        const cd:CountryDiscovery={code,name:bonus.name,flag:bonus.flag,rarity:bonus.rarity,points:bonus.points,discoveredAt:new Date().toISOString()}
        countriesR.current=[...countriesR.current,cd]; setCountries([...countriesR.current]); saveCountries(countriesR.current)
        scoreR.current+=bonus.points; setScore(scoreR.current); saveScore(scoreR.current)
        applyXP(bonus.points); updateObj('countries',1); updateObj('score',bonus.points)
        notify({type:'country',title:`${bonus.flag} ${bonus.name}`,subtitle:bonus.reason,points:bonus.points,rarity:bonus.rarity})
        addLog({type:'country',title:bonus.name,subtitle:bonus.reason,icon:bonus.flag,points:bonus.points,rarity:bonus.rarity})
      } catch {}
    },1500)
  },[applyXP,notify,addLog,updateObj])

  const fetchNearby=useCallback(async(lat:number,lng:number)=>{
    const key=`${Math.floor(lat/0.02)},${Math.floor(lng/0.02)}`
    if(key===lastFetchKey.current) return
    lastFetchKey.current=key
    // Vérifier si on est loin de tous les monuments existants (nouvelle zone)
    const isNewZone = monR.current.length === 0 || !monR.current.some(m => {
      const d = Math.sqrt(Math.pow(m.lat-lat,2)+Math.pow(m.lng-lng,2))
      return d < 0.05 // ~5km
    })
    const existingIds = isNewZone ? new Set<string>() : new Set(monR.current.map(m=>m.id))
    if (isNewZone) console.log('Nouvelle zone détectée — rechargement monuments')
    const newMs=await fetchMonuments(lat,lng,existingIds)
    if(newMs.length>0){
      const merged = isNewZone ? newMs : [...monR.current,...newMs]
      monR.current=merged; setMonuments([...merged]); saveMonuments(merged)
    }
  },[])

  const trackPath=useCallback((lat:number,lng:number)=>{
    const pt:ExplorationPath={lat,lng,timestamp:Date.now()}
    pathR.current=[...pathR.current,pt].slice(-500)
    setPath([...pathR.current])
    if(pathR.current.length%10===0) savePath(pathR.current)
  },[])

  const move=useCallback((lat:number,lng:number,newLat:number,newLng:number)=>{
    const d=dist(lat,lng,newLat,newLng)
    distR.current+=d; setTotalDist(distR.current); saveDist(distR.current); updateObj('distance',d)
    latR.current=newLat; lngR.current=newLng
    setPlayerLat(newLat); setPlayerLng(newLng); savePlayer(newLat,newLng)
    trackPath(newLat,newLng)
    const updated=revealAt(newLat,newLng,monR.current)
    monR.current=updated; detectCountry(newLat,newLng); fetchNearby(newLat,newLng)
    // Update territory every ~100m
    fetchTerritory(newLat,newLng).then(t=>{ if(t) setTerritory(t) })
  },[revealAt,detectCountry,fetchNearby,trackPath,updateObj])

  const startGPS=useCallback(()=>{
    if(!navigator.geolocation) return
    setGpsActive(true)
    gpsId.current=navigator.geolocation.watchPosition(pos=>{
      const {latitude:nlat,longitude:nlng}=pos.coords
      const d=dist(latR.current,lngR.current,nlat,nlng)
      if(d<0.5) return
      move(latR.current,lngR.current,nlat,nlng)
    },()=>setGpsActive(false),{enableHighAccuracy:true,maximumAge:0,timeout:5000})
  },[move])

  const stopGPS=useCallback(()=>{
    if(gpsId.current!==null){navigator.geolocation.clearWatch(gpsId.current);gpsId.current=null}
    setGpsActive(false)
  },[])

  useEffect(()=>{
    const p=loadPlayer(); const t=loadTiles(); const sc=loadScore(); const x=loadXP()
    const b=loadBadges(); const ms=loadMonuments(); const cs=loadCountries()
    const os=loadObjectives(); const lg=loadLog(); const pt=loadPath(); const d=loadDist()
    tiles.current=t; scoreR.current=sc; xpR.current=x; badgesR.current=b
    monR.current=ms; countriesR.current=cs; logR.current=lg; pathR.current=pt; distR.current=d
    cs.forEach(c=>discovCodes.current.add(c.code))
    const {level:lv,xpIntoLevel:into,xpForNext:fn}=getLevelFromXP(x)
    levelR.current=lv; latR.current=p.lat; lngR.current=p.lng
    setScore(sc); setXP(x); setLevel(lv); setXpIntoLevel(into); setXpForNext(fn)
    setLevelTitle(LEVEL_TITLES[Math.min(lv-1,LEVEL_TITLES.length-1)])
    setBadges(b); setMonuments(ms); setCountries(cs); setLog(lg); setPath(pt); setTotalDist(d)
    setPlayerLat(p.lat); setPlayerLng(p.lng)
    const today=todayStr()
    if(os.length>0&&os[0].date===today){objR.current=os;setObjectives(os)}
    else{const fresh=genObjectives(today);objR.current=fresh;setObjectives(fresh);saveObjectives(fresh)}
    setInitialized(true)
    // Load saved territory
    setTerritory(loadTerritory())
    setTimeout(()=>{
      revealAt(p.lat,p.lng,ms); detectCountry(p.lat,p.lng); fetchNearby(p.lat,p.lng)
    },100)
  },[]) // eslint-disable-line

  return {
    playerLat,playerLng,score,xp,level,xpIntoLevel,xpForNext,levelTitle,
    badges,monuments,countries,objectives,log,path,notifications,
    gpsActive,initialized,totalTiles:tiles.current.size,
    totalDist,tiles:tiles.current,territory,
    explorationPercent:(Math.min(100,tiles.current.size/100)).toFixed(1),
    startGPS,stopGPS,gpsHeading,
  }
}

// Export heading tracking - added separately
export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null)
  const prevPos = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Try device orientation first
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const alpha = (e as any).webkitCompassHeading ?? e.alpha
      if (alpha !== null) setHeading(Math.round(alpha))
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true)
      window.addEventListener('deviceorientation', handleOrientation as any, true)
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true)
      window.removeEventListener('deviceorientation', handleOrientation as any, true)
    }
  }, [])

  return { heading }
}
