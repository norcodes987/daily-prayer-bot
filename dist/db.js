"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default("prayer.db");
// Member table
db.prepare(`
  CREATE TABLE IF NOT EXISTS group_members (
    user_id TEXT PRIMARY KEY,
    display_name TEXT
  )
`).run();
// Prayers table
db.prepare(`
  CREATE TABLE IF NOT EXISTS prayers (
    user_id TEXT,
    date TEXT,
    text TEXT,
    PRIMARY KEY(user_id, date)
  )
`).run();
// Pinned Message table
db.prepare(`
  CREATE TABLE IF NOT EXISTS pinned_message (
  chat_id TEXT PRIMARY KEY,
  message_id INTEGER)
  `).run();
exports.default = db;
//# sourceMappingURL=db.js.map