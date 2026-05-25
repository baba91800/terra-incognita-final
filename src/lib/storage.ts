import type { Badge, Monument, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '../types/game'
import { DEFAULT_BADGES, DEFAULT_MONUMENTS, DEFAULT_LAT, DEFAULT_LNG } from './constants'

const g=(k:string)=>{try{return localStorage.getItem(k)}catch{return null}}
const s=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{}}
const r=(k:string)=>{try{localStorage.removeItem(k)}catch{}}

const K={TILES:'ti2_tiles',SCORE:'ti2_score',XP:'ti2_xp',DIST:'ti2_dist',
  BADGES:'ti2_badges',MONUMENTS:'ti2_monuments',PLAYER:'ti2_player',
  COUNTRIES:'ti2_countries',OBJECTIVES:'ti2_obj',LOG:'ti2_log',PATH:'ti2_path'}

export const saveTiles=(t:Set<string>)=>s(K.TILES,JSON.stringify([...t]))
export const loadTiles=():Set<string>=>{const v=g(K.TILES);return v?new Set(JSON.parse(v)):new Set()}
export const saveScore=(n:number)=>s(K.SCORE,String(n))
export const loadScore=():number=>{const v=g(K.SCORE);return v?parseInt(v):0}
export const saveXP=(n:number)=>s(K.XP,String(n))
export const loadXP=():number=>{const v=g(K.XP);return v?parseInt(v):0}
export const saveDist=(n:number)=>s(K.DIST,String(n))
export const loadDist=():number=>{const v=g(K.DIST);return v?parseFloat(v):0}

export const saveBadges=(b:Badge[])=>s(K.BADGES,JSON.stringify(b))
export const loadBadges=():Badge[]=>{
  const v=g(K.BADGES)
  if(v){const saved=JSON.parse(v) as Badge[];return DEFAULT_BADGES.map(d=>saved.find(b=>b.id===d.id)||d)}
  return [...DEFAULT_BADGES]
}
export const saveMonuments=(m:Monument[])=>s(K.MONUMENTS,JSON.stringify(m))
export const loadMonuments=():Monument[]=>{
  const v=g(K.MONUMENTS)
  if(v){
    const saved=JSON.parse(v) as Monument[]
    const base=DEFAULT_MONUMENTS.map(d=>{const f=saved.find(m=>m.id===d.id);return f?{...d,discovered:f.discovered,discoveredAt:f.discoveredAt}:d})
    const extra=saved.filter(m=>!DEFAULT_MONUMENTS.find(d=>d.id===m.id))
    return [...base,...extra]
  }
  return [...DEFAULT_MONUMENTS]
}
export const savePlayer=(lat:number,lng:number)=>s(K.PLAYER,JSON.stringify({lat,lng}))
export const loadPlayer=()=>{const v=g(K.PLAYER);return v?JSON.parse(v):{lat:DEFAULT_LAT,lng:DEFAULT_LNG}}
export const saveCountries=(c:CountryDiscovery[])=>s(K.COUNTRIES,JSON.stringify(c))
export const loadCountries=():CountryDiscovery[]=>{const v=g(K.COUNTRIES);return v?JSON.parse(v):[]}
export const saveObjectives=(o:DailyObjective[])=>s(K.OBJECTIVES,JSON.stringify(o))
export const loadObjectives=():DailyObjective[]=>{const v=g(K.OBJECTIVES);return v?JSON.parse(v):[]}
export const saveLog=(l:DiscoveryLog[])=>s(K.LOG,JSON.stringify(l.slice(-100)))
export const loadLog=():DiscoveryLog[]=>{const v=g(K.LOG);return v?JSON.parse(v):[]}
export const savePath=(p:ExplorationPath[])=>s(K.PATH,JSON.stringify(p.slice(-500)))
export const loadPath=():ExplorationPath[]=>{const v=g(K.PATH);return v?JSON.parse(v):[]}
export const clearAll=()=>Object.values(K).forEach(r)

import type { PersonalMarker } from '../types/game'
const MK = 'ti2_markers'
export const saveMarkers = (m: PersonalMarker[]) => s(MK, JSON.stringify(m))
export const loadMarkers = (): PersonalMarker[] => { const v = g(MK); return v ? JSON.parse(v) : [] }
