export type AppSettings = {
    apiKey: string;
    baseUrl: string;
    model: string;
};
export declare const useSessionStore: import("pinia").StoreDefinition<"session", Pick<{
    settings: import("@vueuse/shared").RemovableRef<AppSettings>;
    sessionId: import("@vueuse/shared").RemovableRef<string>;
    saveSettings: (value: AppSettings) => void;
    setSessionId: (value: string) => void;
    clearSession: () => void;
}, "settings" | "sessionId">, Pick<{
    settings: import("@vueuse/shared").RemovableRef<AppSettings>;
    sessionId: import("@vueuse/shared").RemovableRef<string>;
    saveSettings: (value: AppSettings) => void;
    setSessionId: (value: string) => void;
    clearSession: () => void;
}, never>, Pick<{
    settings: import("@vueuse/shared").RemovableRef<AppSettings>;
    sessionId: import("@vueuse/shared").RemovableRef<string>;
    saveSettings: (value: AppSettings) => void;
    setSessionId: (value: string) => void;
    clearSession: () => void;
}, "saveSettings" | "setSessionId" | "clearSession">>;
