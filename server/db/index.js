const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/app.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Seed default admin on first run
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
  db.prepare(
    "INSERT INTO users (username, password_hash, role, is_active) VALUES ('admin', ?, 'admin', 1)"
  ).run(hash);

  const juniorPass = process.env.JUNIOR_PASSWORD || 'junior123';
  const juniorHash = bcrypt.hashSync(juniorPass, 10);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const expiry = sixMonths.toISOString();

  for (let i = 1; i <= 3; i++) {
    db.prepare(
      "INSERT INTO users (username, password_hash, role, is_active, expires_at) VALUES (?, ?, 'junior', 1, ?)"
    ).run(`junior${i}`, juniorHash, expiry);
  }
}

module.exports = db;
