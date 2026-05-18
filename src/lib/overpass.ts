import type { Monument } from '../types/game'
import type { Rarity } from '../types/game'

const fetched = new Set<string>()
function zoneKey(lat:number,lng:number) { return `${Math.floor(lat/0.03)},${Math.floor(lng/0.03)}` }

function classify(tags:Record<string,string>):{rarity:Rarity;type:string;icon:string} {
  if(tags.natural==='volcano')          return {rarity:'legendary',type:'volcano',   icon:'🌋'}
  if(tags.natural==='glacier')          return {rarity:'legendary',type:'glacier',   icon:'🧊'}
  if(tags.historic==='palace')          return {rarity:'legendary',type:'palace',    icon:'🏯'}
  if(tags.natural==='cave_entrance')    return {rarity:'epic',     type:'cave',      icon:'🕳️'}
  if(tags.waterway==='waterfall'||tags.natural==='waterfall') return {rarity:'epic',type:'waterfall',icon:'💧'}
  if(tags.natural==='hot_spring')       return {rarity:'epic',     type:'hot_spring',icon:'♨️'}
  if(tags.historic==='castle')          return {rarity:'epic',     type:'castle',    icon:'🏰'}
  if(tags.boundary==='national_park')   return {rarity:'epic',     type:'park',      icon:'🌲'}
  if(tags.natural==='peak')             return {rarity:'epic',     type:'peak',      icon:'⛰️'}
  if(tags.amenity==='cathedral')        return {rarity:'epic',     type:'cathedral', icon:'⛪'}
  if(tags.tourism==='viewpoint')        return {rarity:'rare',     type:'viewpoint', icon:'👁️'}
  if(tags.tourism==='museum')           return {rarity:'rare',     type:'museum',    icon:'🏛️'}
  if(tags.historic==='monument')        return {rarity:'rare',     type:'monument',  icon:'🗿'}
  if(tags.historic==='fort')            return {rarity:'rare',     type:'fort',      icon:'🏰'}
  if(tags.natural==='spring')           return {rarity:'rare',     type:'spring',    icon:'💦'}
  if(tags.tourism==='artwork'&&tags.name) return {rarity:'common', type:'artwork',   icon:'🎨'}
  if(tags.historic==='memorial')        return {rarity:'common',   type:'memorial',  icon:'🪦'}
  if(tags.amenity==='fountain')         return {rarity:'common',   type:'fountain',  icon:'⛲'}
  if(tags.natural==='tree'&&tags.landmark) return {rarity:'rare',  type:'tree',      icon:'🌳'}
  return {rarity:'common',type:'place',icon:'📍'}
}

export async function fetchMonuments(lat:number,lng:number,existingIds:Set<string>): Promise<Monument[]> {
  const key=zoneKey(lat,lng)
  if(fetched.has(key)) return []
  fetched.add(key)
  const q=`[out:json][timeout:20];(
    node["tourism"~"attraction|viewpoint|museum"](around:3000,${lat},${lng});
    node["historic"~"castle|monument|palace|fort|memorial|ruins"](around:3000,${lat},${lng});
    node["natural"~"volcano|cave_entrance|hot_spring|waterfall|peak|glacier|spring|tree"](around:3000,${lat},${lng});
    node["waterway"="waterfall"](around:3000,${lat},${lng});
    node["amenity"~"cathedral|fountain"](around:3000,${lat},${lng});
    node["boundary"="national_park"](around:3000,${lat},${lng});
  );out center;`
  try {
    const res=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:q})
    if(!res.ok) return []
    const data=await res.json()
    const results:Monument[]=[]
    for(const el of data.elements) {
      if(!el.tags?.name) continue
      const id=`osm_${el.type}_${el.id}`
      if(existingIds.has(id)) continue
      const elLat=el.lat||(el.center?.lat)
      const elLng=el.lon||(el.center?.lon)
      if(!elLat||!elLng) continue
      const {rarity,type,icon}=classify(el.tags)
      results.push({id,name:el.tags.name,lat:elLat,lng:elLng,rarity,type,icon,discovered:false})
    }
    return results
  } catch { return [] }
}
