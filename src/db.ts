import DatabaseConstructor, { type Database as DBType } from "better-sqlite3";

const db: DBType = new DatabaseConstructor("prayer.db");

// Member table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS group_members (
    user_id TEXT PRIMARY KEY,
    display_name TEXT
  )
`
).run();

// Prayers table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS prayers (
    user_id TEXT,
    date TEXT,
    text TEXT,
    PRIMARY KEY(user_id, date)
  )
`
).run();

// Pinned Message table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS pinned_message (
  chat_id TEXT PRIMARY KEY,
  message_id INTEGER)
  `
).run();

export default db;
