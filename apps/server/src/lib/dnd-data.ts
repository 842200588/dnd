import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
export type AbilityKey = typeof ABILITIES[number]

export type CharacterCreationInput = {
  name: string
  raceId: string
  classId: string
  baseStats: Record<AbilityKey, number>
  classSkillSelections: string[]
  raceSkillSelections?: string[]
  bonusAbilityChoices?: AbilityKey[]
  notes?: string
}

type DndRules = {
  pointBuy: {
    budget: number
    minScore: number
    maxScore: number
    costs: Record<string, number>
  }
  skills: string[]
  skillLabels: Record<string, string>
  races: Array<{
    id: string
    name: string
    group: string
    speed: number
    size: string
    abilityBonuses: Partial<Record<AbilityKey, number>>
    bonusAbilityChoices?: { count: number; value: number; exclude?: AbilityKey[] }
    traits: string[]
    languages: string[]
    fixedSkills?: string[]
    bonusSkillChoices?: number
  }>
  classes: Array<{
    id: string
    name: string
    hitDie: number
    primaryAbilities: AbilityKey[]
    savingThrows: AbilityKey[]
    skillChoices: { count: number; options: string[] }
    armorModel: string
    startingInventory: Array<{ name: string; quantity: number }>
  }>
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const rulesPath = resolve(currentDir, '../../../../shared/dnd5e.json')
const dndRules = JSON.parse(readFileSync(rulesPath, 'utf8')) as DndRules

type RaceRule = DndRules['races'][number]
type ClassRule = DndRules['classes'][number]

const raceMap = new Map(dndRules.races.map((race) => [race.id, race]))
const classMap = new Map(dndRules.classes.map((clazz) => [clazz.id, clazz]))

export function getRules() {
  return dndRules
}

export function getRaceRule(raceId: string) {
  return raceMap.get(raceId)
}

export function getClassRule(classId: string) {
  return classMap.get(classId)
}

export function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

export function validateAndBuildCharacter(input: CharacterCreationInput) {
  const race = getRaceRule(input.raceId)
  const clazz = getClassRule(input.classId)

  if (!race || !clazz) throw new Error('Invalid race or class selection')

  validatePointBuy(input.baseStats)
  const racialBonuses = computeRacialBonuses(race, input.bonusAbilityChoices ?? [])
  const finalStats = applyBonuses(input.baseStats, racialBonuses)
  const selectedSkills = computeSelectedSkills(race, clazz, input.classSkillSelections, input.raceSkillSelections ?? [])
  const constitutionModifier = getAbilityModifier(finalStats.constitution)

  return {
    race,
    clazz,
    finalStats,
    selectedSkills,
    maxHp: Math.max(1, clazz.hitDie + constitutionModifier),
    armorClass: computeArmorClass(clazz.armorModel, finalStats),
    inventory: clazz.startingInventory,
  }
}

function validatePointBuy(baseStats: Record<AbilityKey, number>) {
  let spent = 0
  for (const ability of ABILITIES) {
    const score = Number(baseStats[ability])
    if (!Number.isInteger(score)) throw new Error(`Ability ${ability} must be an integer`)
    if (score < dndRules.pointBuy.minScore || score > dndRules.pointBuy.maxScore) {
      throw new Error(`Ability ${ability} is out of point-buy range`)
    }
    spent += dndRules.pointBuy.costs[String(score)]
  }
  if (spent > dndRules.pointBuy.budget) throw new Error('Point-buy exceeds the 27-point budget')
}

function computeRacialBonuses(race: RaceRule, bonusChoices: AbilityKey[]) {
  const bonuses: Partial<Record<AbilityKey, number>> = { ...race.abilityBonuses }
  if (!race.bonusAbilityChoices) {
    if (bonusChoices.length > 0) throw new Error('This race has no additional ability choices')
    return bonuses
  }

  const uniqueChoices = [...new Set(bonusChoices)]
  if (uniqueChoices.length !== race.bonusAbilityChoices.count) {
    throw new Error(`This race requires ${race.bonusAbilityChoices.count} additional ability choices`)
  }

  const excluded = new Set(race.bonusAbilityChoices.exclude ?? [])
  for (const choice of uniqueChoices) {
    if (excluded.has(choice)) throw new Error(`Ability ${choice} cannot be selected for this race bonus`)
    bonuses[choice] = (bonuses[choice] ?? 0) + race.bonusAbilityChoices.value
  }
  return bonuses
}

function applyBonuses(baseStats: Record<AbilityKey, number>, bonuses: Partial<Record<AbilityKey, number>>) {
  return ABILITIES.reduce<Record<AbilityKey, number>>((result, ability) => {
    result[ability] = baseStats[ability] + (bonuses[ability] ?? 0)
    return result
  }, {} as Record<AbilityKey, number>)
}

function computeSelectedSkills(race: RaceRule, clazz: ClassRule, classSkillSelections: string[], raceSkillSelections: string[]) {
  const classUnique = [...new Set(classSkillSelections)]
  if (classUnique.length !== clazz.skillChoices.count) {
    throw new Error(`Class ${clazz.name} requires ${clazz.skillChoices.count} skill selections`)
  }
  for (const skill of classUnique) {
    if (!clazz.skillChoices.options.includes(skill)) {
      throw new Error(`Skill ${skill} is not valid for class ${clazz.name}`)
    }
  }

  let raceExtra: string[] = []
  if (race.bonusSkillChoices) {
    const raceUnique = [...new Set(raceSkillSelections)]
    if (raceUnique.length !== race.bonusSkillChoices) {
      throw new Error(`Race ${race.name} requires ${race.bonusSkillChoices} additional skill selections`)
    }
    for (const skill of raceUnique) {
      if (!dndRules.skills.includes(skill)) throw new Error(`Skill ${skill} is not in the SRD skill list`)
    }
    raceExtra = raceUnique
  } else if (raceSkillSelections.length > 0) {
    throw new Error(`Race ${race.name} does not grant extra skill choices`)
  }

  return [...new Set([...(race.fixedSkills ?? []), ...classUnique, ...raceExtra])]
}

function computeArmorClass(armorModel: string, stats: Record<AbilityKey, number>) {
  const dexMod = getAbilityModifier(stats.dexterity)
  const conMod = getAbilityModifier(stats.constitution)
  const wisMod = getAbilityModifier(stats.wisdom)

  switch (armorModel) {
    case 'unarmored-barbarian': return 10 + dexMod + conMod
    case 'unarmored-monk': return 10 + dexMod + wisMod
    case 'light-armor': return 11 + dexMod
    case 'medium-armor-shield': return 16 + Math.min(dexMod, 2)
    case 'medium-armor-wood-shield': return 14 + Math.min(dexMod, 2) + 2
    case 'heavy-armor': return 16
    case 'no-armor':
    default: return 10 + dexMod
  }
}