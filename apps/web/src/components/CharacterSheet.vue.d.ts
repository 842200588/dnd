import type { NpcGameState } from '@/lib/api';
type __VLS_Props = {
    character: {
        name: string;
        race: string;
        className: string;
        level: number;
        maxHp: number;
        currentHp: number;
        armorClass: number;
        goldAmount: number;
        stats: Record<string, number>;
        skills: string[];
        inventory: Array<{
            name: string;
            quantity: number;
        }>;
    };
    npcs: NpcGameState[];
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
