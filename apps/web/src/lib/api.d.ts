export type RulesData = {
    pointBuy: {
        budget: number;
        baseScore?: number;
        minScore: number;
        maxScore: number;
        costs: Record<string, number>;
    };
    skills: string[];
    skillLabels: Record<string, string>;
    races: Array<{
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
    }>;
    classes: Array<{
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
    }>;
};
export type CharacterPayload = {
    name: string;
    raceId: string;
    classId: string;
    notes?: string;
    classSkillSelections: string[];
    raceSkillSelections?: string[];
    bonusAbilityChoices?: string[];
    baseStats: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
};
export type DiceToolEvent = {
    type: 'dice';
    notation: string;
    result: {
        total: number;
        rolls: number[];
        modifier: number;
    };
    reason: string;
};
export type HpToolEvent = {
    type: 'hp';
    previousHp: number;
    currentHp: number;
    delta: number;
    reason: string;
};
export type InventoryToolEvent = {
    type: 'inventory';
    ok: boolean;
    itemName: string;
    quantity: number;
    operation?: string;
    reason: string;
    inventory?: Array<{
        name: string;
        quantity: number;
    }>;
};
export type NpcStatus = {
    name: string;
    color: string;
};
export type NpcGameState = {
    id: number;
    name: string;
    race?: string | null;
    className?: string | null;
    creatureType?: string | null;
    level: number;
    maxHp: number;
    currentHp: number;
    armorClass: number;
    stats: Record<string, number>;
    inventory: Array<{
        name: string;
        quantity: number;
    }>;
    skills: string[];
    affinity: number;
    attitude: string;
    statuses: NpcStatus[];
    notes?: string | null;
};
export type NpcUpsertToolEvent = {
    type: 'npc_upsert';
    npc: NpcGameState;
    reason: string;
};
export type NpcHpToolEvent = {
    type: 'npc_hp';
    name: string;
    previousHp: number;
    currentHp: number;
    delta: number;
    reason: string;
};
export type NpcInventoryToolEvent = {
    type: 'npc_inventory';
    ok: boolean;
    name: string;
    itemName: string;
    quantity: number;
    operation?: string;
    reason: string;
    inventory?: Array<{
        name: string;
        quantity: number;
    }>;
};
export type NpcAffinityToolEvent = {
    type: 'npc_affinity';
    name: string;
    previousAffinity: number;
    currentAffinity: number;
    attitude: string;
    reason: string;
};
export type NpcStatusToolEvent = {
    type: 'npc_status';
    name: string;
    statuses: NpcStatus[];
    operation: string;
    reason: string;
};
export type ToolEvent = DiceToolEvent | HpToolEvent | InventoryToolEvent | NpcUpsertToolEvent | NpcHpToolEvent | NpcInventoryToolEvent | NpcAffinityToolEvent | NpcStatusToolEvent | {
    type: 'unknown';
    message?: string;
    [key: string]: unknown;
};
export type GameState = {
    sessionId: string;
    summary: string;
    character: {
        name: string;
        race: string;
        className: string;
        raceId: string;
        classId: string;
        level: number;
        maxHp: number;
        currentHp: number;
        armorClass: number;
        goldAmount: number;
        notes?: string;
        stats: Record<string, number>;
        skills: string[];
        inventory: Array<{
            name: string;
            quantity: number;
        }>;
    };
    npcs: NpcGameState[];
    recentMessages: Array<{
        role: string;
        content: string;
        tool_name?: string;
        created_at: string;
    }>;
};
export declare function fetchRules(): Promise<RulesData>;
export declare function createCharacter(payload: CharacterPayload): Promise<{
    sessionId: string;
}>;
export declare function fetchGameState(sessionId: string): Promise<GameState>;
export declare function resetGameState(sessionId: string): Promise<{
    ok: boolean;
}>;
export declare function streamChat(input: {
    sessionId: string;
    message: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    onToken: (token: string) => void | Promise<void>;
    onTool: (tool: ToolEvent) => void | Promise<void>;
}): Promise<void>;
