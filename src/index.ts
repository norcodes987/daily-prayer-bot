import { Telegraf, Context } from "telegraf";
import "dotenv/config";
import cron from "node-cron";
import { ButType } from "./interface";
import {
  ensureMemberExist,
  getGroupMembers,
  getKeyboard,
  getPrayersToday,
  getTodayCardMessageId,
  getTodayPrayersText,
  prayerTemplate,
  savePrayer,
  saveToayCardMessageId,
  today,
} from "./utils";

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

if (!BOT_TOKEN || !GROUP_CHAT_ID) {
  throw new Error("Please set BOT_TOKEN and GROUP_CHAT_ID");
}

const bot = new Telegraf<Context>(BOT_TOKEN);

//get chat id
// bot.on("message", (ctx) => {
//   console.log("CHAT ID: ", ctx.chat.id);
// });

//daily prayer card
function renderDailyPrayerCard(): string {
  const members = getGroupMembers();
  const prayersToday = getPrayersToday();
  const progress = members.map((m) =>
    prayersToday.includes(m.user_id) ? "🟢" : "⚪"
  );
  const count = prayersToday.length;
  const total = members.length;

  let text = `📖 Daily Prayer – ${today()}\n \n`;
  text += `👥 Today’s Progress\n${progress.join(
    ""
  )}   ${count} / ${total} submitted\n\n`;
  members.forEach((m, idx) => {
    text += `${progress[idx] === "🟢" ? "✅" : "⬜"} ${m.display_name}\n`;
  });
  return text;
}

async function upsertDailyPrayerCard(ctx?: Context) {
  const me = await bot.telegram.getMe();
  const keyboard = getKeyboard(me.username!);
  const currentDate = today();
  const existingMessageId = getTodayCardMessageId(currentDate);

  try {
    if (existingMessageId) {
      await bot.telegram.editMessageText(
        GROUP_CHAT_ID,
        existingMessageId,
        undefined,
        renderDailyPrayerCard(),
        keyboard
      );
      return;
    }
  } catch (err) {
    console.warn("Edit failed, recreating daily card");
  }
  //create new card
  const msg = await bot.telegram.sendMessage(
    GROUP_CHAT_ID as string,
    renderDailyPrayerCard(),
    keyboard
  );
  saveToayCardMessageId(currentDate, msg.message_id);
}
// === COMMANDS ===

const awaitingPrayer = new Map<string, number>(); //userId, messageId

bot.start(async (ctx) => {
  // add prayer
  if (ctx.payload === ButType.ADD_PRAYER) {
    const userId = ctx.from.id.toString();
    ensureMemberExist(userId, ctx.from.first_name || "Anonymous");
    const msg = await ctx.reply(prayerTemplate(), {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true },
    });
    awaitingPrayer.set(userId, msg.message_id);
    return;
  }
  // view prayers
  if (ctx.payload === ButType.VIEW_TODAY) {
    await ctx.reply(getTodayPrayersText());
    return;
  }
  await ctx.reply("🙏 Welcome to the Daily Prayer Bot!");
});

// reply to template
bot.on("text", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!awaitingPrayer.has(userId)) return;
  ensureMemberExist(userId, ctx.from.first_name || "Anonymous");
  savePrayer(userId, ctx.message.text || "");
  awaitingPrayer.delete(userId);

  await ctx.reply("✅ Your prayer has been added. Thank you! ❤️");

  await upsertDailyPrayerCard();
});

// Daily cron at 12 AM
// cron.schedule("0 0 * * *", async () => {
//   console.log("📌 Creating new daily pinned prayer card...");
//   await upsertDailyPrayerCard();
// });

(async () => {
  console.log("Testing pinned card now...");
  await upsertDailyPrayerCard();
})();

bot.launch().then(async () => {
  console.log("🙏 Prayer bot running");
});
