"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPinnedMessageId = exports.savePinnedMessageId = exports.getPrayersToday = exports.getGroupMembers = exports.savePrayer = exports.addMember = exports.prayerTemplate = exports.today = void 0;
const db_1 = __importDefault(require("./db"));
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
const today = () => new Date().toISOString().slice(0, 10); //e.g. "2026-01-10" for Jan 10 2026
exports.today = today;
const prayerTemplate = () => {
    return ("🙏 Please fill in your prayer by replying to this message:\n\n" +
        "📝 *Application*\n\n" +
        "🙌 *Thanksgiving*\n\n" +
        "🙏 *Prayer Request*\n\n");
};
exports.prayerTemplate = prayerTemplate;
const addMember = (user_id, display_name) => {
    db_1.default.prepare(`INSERT OR IGNORE INTO group_members(user_id, display_name) VALUES(?, ?)`).run(user_id, display_name);
};
exports.addMember = addMember;
const savePrayer = (user_id, text) => {
    db_1.default.prepare(`
    INSERT OR REPLACE INTO prayers(user_id, date, text) VALUES (?, ?, ?)
    `).run(user_id, (0, exports.today)(), text);
};
exports.savePrayer = savePrayer;
const getGroupMembers = () => {
    return db_1.default
        .prepare(`
    SELECT * FROM group_members
    `)
        .all();
};
exports.getGroupMembers = getGroupMembers;
const getPrayersToday = () => {
    return db_1.default
        .prepare(`
        SELECT user_id FROM prayers WHERE date = ?
        `)
        .all((0, exports.today)())
        .map((row) => row.user_id);
};
exports.getPrayersToday = getPrayersToday;
const savePinnedMessageId = (message_id) => {
    db_1.default.prepare(`
    INSERT OR REPLACE INTO pinned_message(chat_id, message_id)
    VALUES (?, ?)
  `).run(GROUP_CHAT_ID, message_id);
};
exports.savePinnedMessageId = savePinnedMessageId;
const getPinnedMessageId = () => {
    const row = db_1.default
        .prepare("SELECT message_id FROM pinned_message WHERE chat_id = ?")
        .get(GROUP_CHAT_ID);
    return row?.message_id;
};
exports.getPinnedMessageId = getPinnedMessageId;
//# sourceMappingURL=utils.js.map