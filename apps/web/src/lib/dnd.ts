import type { RulesData } from './api'

export const ABILITY_LABELS = {
  strength: '力量',
  dexterity: '敏捷',
  constitution: '体质',
  intelligence: '智力',
  wisdom: '感知',
  charisma: '魅力',
} as const

export const ABILITY_KEYS = Object.keys(ABILITY_LABELS) as Array<keyof typeof ABILITY_LABELS>

export type AbilityKey = keyof typeof ABILITY_LABELS
export type RaceRule = RulesData['races'][number]
export type ClassRule = RulesData['classes'][number]

let rulesCache: RulesData | null = null

export function setRules(rules: RulesData) {
  rulesCache = rules
}

export function getRules() {
  if (!rulesCache) {
    throw new Error('D&D rules not loaded yet')
  }
  return rulesCache
}

export function getRaceRule(raceId: string) {
  return getRules().races.find((item) => item.id === raceId)
}

export function getClassRule(classId: string) {
  return getRules().classes.find((item) => item.id === classId)
}

export function getPointBuySpent(baseStats: Record<AbilityKey, number>) {
  const costs = getRules().pointBuy.costs as Record<string, number>
  return ABILITY_KEYS.reduce((sum, ability) => sum + Number(costs[String(baseStats[ability])]), 0)
}

export function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

export function getSkillLabel(skill: string) {
  return getRules().skillLabels[skill] ?? skill
}

export function computeFinalStats(input: {
  raceId: string
  baseStats: Record<AbilityKey, number>
  bonusAbilityChoices: AbilityKey[]
}) {
  const race = getRaceRule(input.raceId)
  const bonuses = { ...(race?.abilityBonuses ?? {}) } as Partial<Record<AbilityKey, number>>
  if (race?.bonusAbilityChoices) {
    for (const choice of input.bonusAbilityChoices) {
      bonuses[choice] = (bonuses[choice] ?? 0) + race.bonusAbilityChoices.value
    }
  }

  return ABILITY_KEYS.reduce<Record<AbilityKey, number>>((result, ability) => {
    result[ability] = input.baseStats[ability] + (bonuses[ability] ?? 0)
    return result
  }, {} as Record<AbilityKey, number>)
}

export function computeDerivedValues(input: {
  classId: string
  raceId: string
  baseStats: Record<AbilityKey, number>
  bonusAbilityChoices: AbilityKey[]
}) {
  const clazz = getClassRule(input.classId)
  const finalStats = computeFinalStats(input)
  const conMod = getAbilityModifier(finalStats.constitution)
  const dexMod = getAbilityModifier(finalStats.dexterity)
  const wisMod = getAbilityModifier(finalStats.wisdom)

  let armorClass = 10 + dexMod
  switch (clazz?.armorModel) {
    case 'unarmored-barbarian':
      armorClass = 10 + dexMod + conMod
      break
    case 'unarmored-monk':
      armorClass = 10 + dexMod + wisMod
      break
    case 'light-armor':
      armorClass = 11 + dexMod
      break
    case 'medium-armor-shield':
      armorClass = 16 + Math.min(dexMod, 2)
      break
    case 'medium-armor-wood-shield':
      armorClass = 14 + Math.min(dexMod, 2) + 2
      break
    case 'heavy-armor':
      armorClass = 16
      break
  }

  const inventory = clazz?.startingInventory ?? []

  return {
    finalStats,
    maxHp: Math.max(1, (clazz?.hitDie ?? 0) + conMod),
    armorClass,
    inventory,
  }
}

export type CharacterPayload = {
  name: string
  raceId: string
  classId: string
  notes: string
  classSkillSelections: string[]
  raceSkillSelections: string[]
  bonusAbilityChoices: AbilityKey[]
  baseStats: Record<AbilityKey, number>
}
