import { TILE_SIZE } from './constants'

const MPL = 111320

export function dist(lat1:number,lng1:number,lat2:number,lng2:number) {
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export function latLngToTile(lat:number,lng:number) {
  const MPG=MPL*Math.cos(lat*Math.PI/180)
  return { tx:Math.floor(lng*MPG/TILE_SIZE), ty:Math.floor(lat*MPL/TILE_SIZE) }
}

export function tilesInRadius(lat:number,lng:number,radius:number): string[] {
  const MPG=MPL*Math.cos(lat*Math.PI/180)
  const {tx:cx,ty:cy}=latLngToTile(lat,lng)
  const r=Math.ceil(radius/TILE_SIZE)+1
  const keys:string[]=[]
  for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++) {
    const tx=cx+dx, ty=cy+dy
    const tLat=(ty+0.5)*TILE_SIZE/MPL, tLng=(tx+0.5)*TILE_SIZE/MPG
    if(dist(lat,lng,tLat,tLng)<=radius) keys.push(`${tx}:${ty}`)
  }
  return keys
}

export function movePos(lat:number,lng:number,dir:string,m:number) {
  const MPG=MPL*Math.cos(lat*Math.PI/180)
  if(dir==='north') return {lat:lat+m/MPL,lng}
  if(dir==='south') return {lat:lat-m/MPL,lng}
  if(dir==='east')  return {lat,lng:lng+m/MPG}
  return {lat,lng:lng-m/MPG}
}

export function tileToLatLng(tx:number,ty:number,refLat:number) {
  const MPG=MPL*Math.cos(refLat*Math.PI/180)
  return { lat:(ty+0.5)*TILE_SIZE/MPL, lng:(tx+0.5)*TILE_SIZE/MPG }
}
