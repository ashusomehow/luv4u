-- Luv4u v3 Database Schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  gift_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS gift_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(gift_id, visitor_hash)
);

CREATE TABLE IF NOT EXISTS gift_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  reaction TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gifts_expires ON gifts(expires_at);
CREATE INDEX IF NOT EXISTS idx_views_gift ON gift_views(gift_id);
CREATE INDEX IF NOT EXISTS idx_replies_gift ON gift_replies(gift_id);
