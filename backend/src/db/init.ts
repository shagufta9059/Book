// backend/src/db/init.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), "bookit.db");

// Ensure the db file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "");
}

export const db: any = new Database(DB_PATH);

// On first load, initialize tables:
export function initializeDatabase() {
  // Experiences Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      price REAL NOT NULL,
      duration_hours INTEGER NOT NULL,
      location TEXT NOT NULL,
      category TEXT,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Slots Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS slots (
      id TEXT PRIMARY KEY,
      experience_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      booked_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(experience_id, date, start_time),
      FOREIGN KEY(experience_id) REFERENCES experiences(id) ON DELETE CASCADE
    );
  `);

  // Bookings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      slot_id TEXT NOT NULL,
      experience_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT,
      number_of_guests INTEGER NOT NULL,
      base_price REAL NOT NULL,
      promo_code TEXT,
      discount_amount REAL DEFAULT 0,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'confirmed',
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(slot_id) REFERENCES slots(id) ON DELETE CASCADE,
      FOREIGN KEY(experience_id) REFERENCES experiences(id) ON DELETE CASCADE
    );
  `);

  // Promo Codes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      max_uses INTEGER,
      current_uses INTEGER DEFAULT 0,
      valid_from DATETIME,
      valid_until DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_slots_experience_id ON slots(experience_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(user_email);`);

  console.log(`✅ SQLite DB ready at ${DB_PATH}`);
}