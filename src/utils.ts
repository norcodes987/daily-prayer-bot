import db from "./db";
import { Member } from "./interface";

const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
export const today = (): string => new Date().toISOString().slice(0, 10); //e.g. "2026-01-10" for Jan 10 2026

export const prayerTemplate = () => {
  return (
    "🙏 Please fill in your prayer by replying to this message:\n\n" +
    "📝 *Application*\n\n" +
    "🙌 *Thanksgiving*\n\n" +
    "🙏 *Prayer Request*\n\n"
  );
};
export const addMember = (user_id: string, display_name: string) => {
  db.prepare(
    `INSERT OR IGNORE INTO group_members(user_id, display_name) VALUES(?, ?)`
  ).run(user_id, display_name);
};

export const savePrayer = (user_id: string, text: string) => {
  db.prepare(
    `
    INSERT OR REPLACE INTO prayers(user_id, date, text) VALUES (?, ?, ?)
    `
  ).run(user_id, today(), text);
};

export const getGroupMembers = () => {
  return db
    .prepare<[], Member>(
      `
    SELECT * FROM group_members
    `
    )
    .all();
};

export const getPrayersToday = () => {
  return db
    .prepare(
      `
        SELECT user_id FROM prayers WHERE date = ?
        `
    )
    .all(today())
    .map((row: any) => row.user_id);
};

export const savePinnedMessageId = (message_id: number) => {
  db.prepare(
    `
    INSERT OR REPLACE INTO pinned_message(chat_id, message_id)
    VALUES (?, ?)
  `
  ).run(GROUP_CHAT_ID, message_id);
};

export const getPinnedMessageId = (): number => {
  const row = db
    .prepare("SELECT message_id FROM pinned_message WHERE chat_id = ?")
    .get(GROUP_CHAT_ID) as { message_id: number };

  return row?.message_id;
};
