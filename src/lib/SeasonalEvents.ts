// Événements saisonniers — badges spéciaux selon la période

export interface SeasonalEvent {
  id: string
  name: string
  description: string
  icon: string
  startMonth: number // 1-12
  endMonth: number
  badgeId: string
  condition: string
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'winter_explorer',
    name: 'Explorateur Hivernal',
    description: 'Explorer en décembre, janvier ou février',
    icon: '❄️',
    startMonth: 12, endMonth: 2,
    badgeId: 'bs1',
    condition: 'Explorer pendant l\'hiver'
  },
  {
    id: 'spring_explorer',
    name: 'Esprit du Printemps',
    description: 'Découvrir un jardin ou parc au printemps',
    icon: '🌸',
    startMonth: 3, endMonth: 5,
    badgeId: 'bs2',
    condition: 'Trouver un jardin entre mars et mai'
  },
  {
    id: 'summer_explorer',
    name: 'Aventurier Estival',
    description: 'Explorer 5 km² en été',
    icon: '☀️',
    startMonth: 6, endMonth: 8,
    badgeId: 'bs3',
    condition: 'Explorer 5 km² entre juin et août'
  },
  {
    id: 'autumn_explorer',
    name: 'Chasseur d\'Automne',
    description: 'Trouver un monument en automne',
    icon: '🍂',
    startMonth: 9, endMonth: 11,
    badgeId: 'bs4',
    condition: 'Trouver un monument entre sept. et nov.'
  },
]

export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export function getActiveEvent(): SeasonalEvent | null {
  const month = new Date().getMonth() + 1
  return SEASONAL_EVENTS.find(e => {
    if (e.startMonth <= e.endMonth) return month >= e.startMonth && month <= e.endMonth
    return month >= e.startMonth || month <= e.endMonth // hiver: déc-fév
  }) || null
}

// Badges saisonniers à ajouter dans DEFAULT_BADGES
export const SEASONAL_BADGES = [
  { id:'bs1', name:'Explorateur Hivernal', description:'Explorer pendant l\'hiver', icon:'❄️', earned:false },
  { id:'bs2', name:'Esprit du Printemps',  description:'Trouver un jardin au printemps', icon:'🌸', earned:false },
  { id:'bs3', name:'Aventurier Estival',   description:'Explorer 5 km² en été', icon:'☀️', earned:false },
  { id:'bs4', name:'Chasseur d\'Automne',  description:'Trouver un monument en automne', icon:'🍂', earned:false },
]
