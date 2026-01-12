import { Telegraf, Context } from "telegraf";
import "dotenv/config";
import db from "./db";
import cron from "node-cron";
import { ButType, type Member, type Prayer } from "./interface";
import {
  addMember,
  getGroupMembers,
  getPinnedMessageId,
  getPrayersToday,
  prayerTemplate,
  savePinnedMessageId,
  savePrayer,
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

  let text = `📖 Daily Prayer – ${today()}\n────────────────────────────\n`;
  text += `👥 Today’s Progress\n${progress.join(
    ""
  )}   ${count} / ${total} submitted\n\n`;
  members.forEach((m, idx) => {
    text += `${progress[idx] === "🟢" ? "✅" : "⬜"} ${m.display_name}\n`;
  });
  return text;
}

// pin and update functions
async function pinDailyPrayerCard() {
  const me = await bot.telegram.getMe();
  const botUsername = me.username!;
  const msg = await bot.telegram.sendMessage(
    GROUP_CHAT_ID ?? 0,
    renderDailyPrayerCard(),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✍️ Add Prayer",
              url: `https://t.me/${botUsername}?start=${ButType.ADD_PRAYER}`,
            },
          ],
          [{ text: "📜 View Today", callback_data: ButType.VIEW_TODAY }],
        ],
      },
    }
  );
  await bot.telegram.pinChatMessage(GROUP_CHAT_ID ?? 0, msg.message_id, {
    disable_notification: true,
  });
  savePinnedMessageId(msg.message_id);
}

// === COMMANDS ===

const awaitingPrayer = new Map<string, number>(); //userId, messageId

// add prayer
bot.start(async (ctx) => {
  if (ctx.payload === ButType.ADD_PRAYER) {
    const userId = ctx.from.id.toString();
    addMember(userId, ctx.from.first_name || "Anonymous");
    const msg = await ctx.reply(prayerTemplate(), {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true },
    });
    awaitingPrayer.set(userId, msg.message_id);
  } else {
    await ctx.reply("🙏 Welcome to the Daily Prayer Bot!");
  }
});
// reply to template
bot.on("text", async (ctx) => {
  const msg = ctx.message;
  const userId = ctx.from.id.toString();
  const expectedMsgId = awaitingPrayer.get(userId);

  if (!expectedMsgId) return;
  if (msg.reply_to_message?.message_id !== expectedMsgId) return;

  savePrayer(userId, msg.text || "");
  awaitingPrayer.delete(userId);

  await ctx.reply("✅ Your prayer has been added. Thank you! ❤️");

  const pinnedId = getPinnedMessageId();
  if (pinnedId) {
    await ctx.telegram.editMessageText(
      GROUP_CHAT_ID,
      pinnedId,
      undefined,
      renderDailyPrayerCard()
    );
  }
});

//  view prayers
bot.action(ButType.VIEW_TODAY, async (ctx) => {
  const prayers: Prayer[] = db
    .prepare<string, Prayer>("SELECT * FROM prayers WHERE date = ?")
    .all(today());
  let text = `📜 Today’s Prayers – ${today()}\n────────────────────\n`;
  prayers.forEach((p) => {
    const member = db
      .prepare<string, Member>(
        "SELECT display_name FROM group_members WHERE user_id = ?"
      )
      .get(p.user_id);
    text += `🙏 ${(member as Member).display_name}\n• ${p.text}\n\n`;
  });
  await ctx.answerCbQuery();
  await ctx.reply(text);
});

// Daily cron at 12 AM
// cron.schedule("0 0 * * *", async () => {
//   console.log("📌 Creating new daily pinned prayer card...");
//   await pinDailyPrayerCard();
// });

(async () => {
  console.log("Testing pinned card now...");
  await pinDailyPrayerCard();
})();

bot.launch().then(async () => {
  console.log("🙏 Prayer bot running");

  if (!getPinnedMessageId()) {
    await pinDailyPrayerCard();
  }
});
