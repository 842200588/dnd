import type { RulesData } from './api';
export declare const ABILITY_LABELS: {
    readonly strength: "力量";
    readonly dexterity: "敏捷";
    readonly constitution: "体质";
    readonly intelligence: "智力";
    readonly wisdom: "感知";
    readonly charisma: "魅力";
};
export declare const ABILITY_KEYS: Array<keyof typeof ABILITY_LABELS>;
export type AbilityKey = keyof typeof ABILITY_LABELS;
export type RaceRule = RulesData['races'][number];
export type ClassRule = RulesData['classes'][number];
export declare function setRules(rules: RulesData): void;
export declare function getRules(): RulesData;
export declare function getRaceRule(raceId: string): {
    id: string;
    name: string;
    group: string;
    speed: number;
    size: string;
    abilityBonuses: Record<string, number>;
    bonusAbilityChoices?: {
        count: number;
        value: number;
        exclude?: string[];
    };
    traits: string[];
    languages: string[];
    fixedSkills?: string[];
    bonusSkillChoices?: number;
} | undefined;
export declare function getClassRule(classId: string): {
    id: string;
    name: string;
    hitDie: number;
    primaryAbilities: string[];
    savingThrows: string[];
    skillChoices: {
        count: number;
        options: string[];
    };
    armorModel: string;
    startingInventory: Array<{
        name: string;
        quantity: number;
    }>;
} | undefined;
export declare function getPointBuySpent(baseStats: Record<AbilityKey, number>): number;
export declare function getAbilityModifier(score: number): number;
export declare function getSkillLabel(skill: string): string;
export declare function computeFinalStats(input: {
    raceId: string;
    baseStats: Record<AbilityKey, number>;
    bonusAbilityChoices: AbilityKey[];
}): Record<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", number>;
export declare function computeDerivedValues(input: {
    classId: string;
    raceId: string;
    baseStats: Record<AbilityKey, number>;
    bonusAbilityChoices: AbilityKey[];
}): {
    finalStats: Record<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", number>;
    maxHp: number;
    armorClass: number;
    inventory: {
        name: string;
        quantity: number;
    }[];
};
export type CharacterPayload = {
    name: string;
    raceId: string;
    classId: string;
    notes: string;
    classSkillSelections: string[];
    raceSkillSelections: string[];
    bonusAbilityChoices: AbilityKey[];
    baseStats: Record<AbilityKey, number>;
};
