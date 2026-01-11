import { Member } from "./interface";
export declare const today: () => string;
export declare const prayerTemplate: () => string;
export declare const addMember: (user_id: string, display_name: string) => void;
export declare const savePrayer: (user_id: string, text: string) => void;
export declare const getGroupMembers: () => Member[];
export declare const getPrayersToday: () => any[];
export declare const savePinnedMessageId: (message_id: number) => void;
export declare const getPinnedMessageId: () => number;
//# sourceMappingURL=utils.d.ts.map