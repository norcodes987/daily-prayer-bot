import db from "./db";
import { ButType, Member, Prayer } from "./interface";

export function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
export const prayerTemplate = () => {
  return (
    "🙏 Please fill in your prayer by replying to this message:\n\n" +
    "📝 *Application*\n\n" +
    "🙌 *Thanksgiving*\n\n" +
    "🙏 *Prayer Request*\n\n"
  );
};

export const savePrayer = (user_id: string, text: string) => {
  db.prepare(
    `
    INSERT OR REPLACE INTO prayers(user_id, date, text) VALUES (?, ?, ?)
    `,
  ).run(user_id, today(), text);
};

export const getGroupMembers = () => {
  return db
    .prepare<[], Member>(
      `
    SELECT * FROM group_members
    `,
    )
    .all();
};

export const getPrayersToday = () => {
  return db
    .prepare(
      `
        SELECT user_id FROM prayers WHERE date = ?
        `,
    )
    .all(today())
    .map((row: any) => row.user_id);
};

export const getTodayPrayersText = (): string => {
  const prayers: Prayer[] = db
    .prepare<string, Prayer>("SELECT * FROM prayers WHERE date = ?")
    .all(today());

  let text = `📜 Today’s Prayers – ${today()}\n\n`;

  prayers.forEach((p) => {
    const member = db
      .prepare<
        string,
        Member
      >("SELECT display_name FROM group_members WHERE user_id = ?")
      .get(p.user_id);

    text += `🙏 ${(member as Member).display_name}\n• ${p.text}\n\n`;
  });

  if (prayers.length === 0) {
    text += "🙏 No prayers submitted yet today.";
  }

  return text;
};

export const getKeyboard = (botUsername: string, date: string) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✍️ Add Prayer",
            url: `https://t.me/${botUsername}?start=${ButType.ADD_PRAYER}`,
          },
        ],
        [
          {
            text: "📜 View Today",
            callback_data: `VIEW_DATE:${date}`,
          },
        ],
      ],
    },
  };
};

export const ensureMemberExist = (userId: string, display_name: string) => {
  db.prepare(
    `INSERT OR IGNORE INTO group_members(user_id, display_name) VALUES(?, ?)`,
  ).run(userId, display_name);
};

export const getTodayCardMessageId = (date: string) => {
  const row = db
    .prepare("SELECT message_id from daily_card WHERE date = ?")
    .get(date) as { message_id: number };
  return row?.message_id ?? null;
};

export const saveTodayCardMessageId = (date: string, messageId: number) => {
  db.prepare(
    "INSERT OR REPLACE INTO daily_card(date, message_id) VALUES(?, ?)",
  ).run(date, messageId);
};

export const getPrayersByDate = (date: string) => {
  return db
    .prepare(`SELECT user_id FROM prayers WHERE date = ?`)
    .all(date)
    .map((row: any) => row.user_id);
};
