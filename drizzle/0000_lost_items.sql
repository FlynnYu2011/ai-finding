CREATE TABLE IF NOT EXISTS lost_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  material TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  public_description TEXT NOT NULL DEFAULT '',
  private_features TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  found_location TEXT NOT NULL,
  found_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lost_items_status_created ON lost_items(status, created_at DESC);
PRAGMA optimize;
