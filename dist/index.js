"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
require("dotenv/config");
const db_1 = __importDefault(require("./db"));
const node_cron_1 = __importDefault(require("node-cron"));
const interface_1 = require("./interface");
const utils_1 = require("./utils");
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
if (!BOT_TOKEN || !GROUP_CHAT_ID) {
    throw new Error("Please set BOT_TOKEN and GROUP_CHAT_ID");
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
//get chat id
// bot.on("message", (ctx) => {
//   console.log("CHAT ID: ", ctx.chat.id);
// });
//daily prayer card
function renderDailyPrayerCard() {
    const members = (0, utils_1.getGroupMembers)();
    const prayersToday = (0, utils_1.getPrayersToday)();
    const progress = members.map((m) => prayersToday.includes(m.user_id) ? "🟢" : "⚪");
    const count = prayersToday.length;
    const total = members.length;
    let text = `📖 Daily Prayer – ${(0, utils_1.today)()}\n────────────────────────────\n`;
    text += `👥 Today’s Progress\n${progress.join("")}   ${count} / ${total} submitted\n\n`;
    members.forEach((m, idx) => {
        text += `${progress[idx] === "🟢" ? "✅" : "⬜"} ${m.display_name}\n`;
    });
    return text;
}
// pin and update functions
async function pinDailyPrayerCard() {
    const me = await bot.telegram.getMe();
    const botUsername = me.username;
    const msg = await bot.telegram.sendMessage(GROUP_CHAT_ID ?? 0, renderDailyPrayerCard(), {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "✍️ Add Prayer",
                        url: `https://t.me/${botUsername}?start=${interface_1.ButType.ADD_PRAYER}`,
                    },
                ],
                [{ text: "📜 View Today", callback_data: interface_1.ButType.VIEW_TODAY }],
            ],
        },
    });
    await bot.telegram.pinChatMessage(GROUP_CHAT_ID ?? 0, msg.message_id, {
        disable_notification: true,
    });
    (0, utils_1.savePinnedMessageId)(msg.message_id);
}
// async function updatePinnedCard() {
//   const pinnedId = getPinnedMessageId();
//   if (!pinnedId) return;
//   const text = renderDailyPrayerCard();
//   await bot.telegram.editMessageText(GROUP_CHAT_ID, pinnedId, undefined, text);
// }
// === COMMANDS ===
const awaitingPrayer = new Map(); //userId, messageId
// bot.start((ctx) => ctx.reply("🙏 Welcome to the Daily Prayer Bot!"));
// add prayer
bot.start(async (ctx) => {
    if (ctx.payload === interface_1.ButType.ADD_PRAYER) {
        const userId = ctx.from.id.toString();
        (0, utils_1.addMember)(userId, ctx.from.first_name || "Anonymous");
        const msg = await ctx.reply((0, utils_1.prayerTemplate)(), {
            parse_mode: "Markdown",
            reply_markup: { force_reply: true },
        });
        awaitingPrayer.set(userId, msg.message_id);
    }
    else {
        await ctx.reply("🙏 Welcome to the Daily Prayer Bot!");
    }
});
// reply to template
bot.on("text", async (ctx) => {
    const msg = ctx.message;
    const userId = ctx.from.id.toString();
    const expectedMsgId = awaitingPrayer.get(userId);
    if (!expectedMsgId)
        return;
    if (msg.reply_to_message?.message_id !== expectedMsgId)
        return;
    (0, utils_1.savePrayer)(userId, msg.text || "");
    awaitingPrayer.delete(userId);
    await ctx.reply("✅ Your prayer has been added. Thank you! ❤️");
    // Optional: update pinned card in group
    const pinnedId = (0, utils_1.getPinnedMessageId)();
    if (pinnedId) {
        await ctx.telegram.editMessageText(GROUP_CHAT_ID, pinnedId, undefined, renderDailyPrayerCard());
    }
});
//  view prayers
bot.action(interface_1.ButType.VIEW_TODAY, async (ctx) => {
    const prayers = db_1.default
        .prepare("SELECT * FROM prayers WHERE date = ?")
        .all((0, utils_1.today)());
    let text = `📜 Today’s Prayers – ${(0, utils_1.today)()}\n────────────────────\n`;
    prayers.forEach((p) => {
        const member = db_1.default
            .prepare("SELECT display_name FROM group_members WHERE user_id = ?")
            .get(p.user_id);
        text += `🙏 ${member.display_name}\n• ${p.text}\n\n`;
    });
    await ctx.answerCbQuery();
    await ctx.reply(text);
});
// Daily cron at 12 AM
node_cron_1.default.schedule("0 0 * * *", async () => {
    console.log("📌 Creating new daily pinned prayer card...");
    await pinDailyPrayerCard();
});
// (async () => {
//   console.log("Testing pinned card now...");
//   await pinDailyPrayerCard();
// })();
bot.launch().then(async () => {
    console.log("🙏 Prayer bot running");
    if (!(0, utils_1.getPinnedMessageId)()) {
        await pinDailyPrayerCard();
    }
});
//# sourceMappingURL=index.js.map