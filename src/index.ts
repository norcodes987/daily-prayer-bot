import { Telegraf, Context } from "telegraf";
import "dotenv/config";
import cron from "node-cron";
import { ButType } from "./interface";
import {
  ensureMemberExist,
  getGroupMembers,
  getKeyboard,
  getPrayersByDate,
  getPrayersUserIdsByDate,
  getTodayCardMessageId,
  prayerTemplate,
  savePrayer,
  saveTodayCardMessageId,
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
function renderDailyPrayerCard(date: string): string {
  const members = getGroupMembers();
  const prayersToday = getPrayersUserIdsByDate(date);
  const progress = members.map((m) =>
    prayersToday.includes(m.user_id) ? "🟢" : "⚪",
  );
  const count = prayersToday.length;
  const total = members.length;

  let text = `📖 Daily Prayer – ${date}\n \n`;
  text += `👥 Today’s Progress\n${progress.join(
    "",
  )}   ${count} / ${total} submitted\n\n`;
  members.forEach((m, idx) => {
    text += `${progress[idx] === "🟢" ? "✅" : "⬜"} ${m.display_name}\n`;
  });
  return text;
}

async function upsertDailyPrayerCard() {
  const me = await bot.telegram.getMe();
  const currentDate = today();
  const keyboard = getKeyboard(me.username!, currentDate);
  const existingMessageId = getTodayCardMessageId(currentDate);

  try {
    if (existingMessageId) {
      await bot.telegram.editMessageText(
        GROUP_CHAT_ID,
        existingMessageId,
        undefined,
        renderDailyPrayerCard(currentDate),
        keyboard,
      );
      return;
    }
  } catch (err) {
    console.warn("Edit failed, recreating daily card");
  }
  //create new card
  const msg = await bot.telegram.sendMessage(
    GROUP_CHAT_ID as string,
    renderDailyPrayerCard(currentDate),
    keyboard,
  );
  saveTodayCardMessageId(currentDate, msg.message_id);
}
// === COMMANDS ===

const awaitingPrayer = new Map<string, number>(); //userId, messageId

bot.start(async (ctx) => {
  console.log(ctx.payload);
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

  // if (ctx.payload?.startsWith(ButType.VIEW_TODAY)) {
  //   const date = ctx.payload.split(":")[1];
  //   const prayers = getPrayersByDate(date as string);
  //   console.log(prayers);
  //   let text = `📖 Prayers for ${date}\n\n`;

  //   if (prayers.length === 0) {
  //     text += "🙏 No prayers submitted yet today.";
  //   } else {
  //     prayers.forEach((p) => {
  //       text += `🙏 ${p.display_name}: ${p.text}\n\n`;
  //     });
  //   }

  //   await ctx.reply(text);
  //   return;
  // }
});

bot.action(/VIEW_DATE:(.+)/, async (ctx) => {
  await ctx.answerCbQuery(); // hide the button loading

  const userId = ctx.from.id;
  const date = ctx.match[1];
  const prayers = getPrayersByDate(date as string);

  let text = `📖 Prayers for ${date}\n\n`;
  if (prayers.length === 0) {
    text += `🙏 No prayers submitted yet for ${date}.`;
  } else {
    prayers.forEach((p) => {
      text += `🙏 ${p.display_name}: ${p.text}\n\n`;
    });
  }

  await ctx.telegram.sendMessage(userId, text);
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

//Daily cron at 12 AM
cron.schedule("0 0 * * *", async () => {
  console.log("📌 Creating new daily pinned prayer card...");
  await upsertDailyPrayerCard();
});

// (async () => {
//   console.log("Testing pinned card now...");
//   await upsertDailyPrayerCard();
// })();

bot.launch().then(async () => {
  console.log("🙏 Prayer bot running");
});
