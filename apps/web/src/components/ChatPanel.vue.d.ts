export type ChatUiMessage = {
    id?: string;
    role: string;
    content: string;
    variant?: 'text' | 'dice' | 'tool';
    loading?: boolean;
    dice?: {
        notation: string;
        reason: string;
        total: number;
        rolls: number[];
        modifier: number;
        status: 'rolling' | 'resolved';
    };
};
type __VLS_Props = {
    summary: string;
    messages: ChatUiMessage[];
    pending: boolean;
    latestToolLog: string;
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    submit: (message: string) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    onSubmit?: ((message: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
