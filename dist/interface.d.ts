export interface Member {
    user_id: string;
    display_name: string;
}
export interface Prayer {
    user_id: string;
    text: string;
}
export interface PinnedMessage {
    chat_id: number;
    message_id: number;
}
export declare enum ButType {
    ADD_PRAYER = "add_prayer",
    VIEW_TODAY = "view_today"
}
//# sourceMappingURL=interface.d.ts.map