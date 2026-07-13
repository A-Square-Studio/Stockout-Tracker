-- Stockout Tracker — database schema
-- Run once against a new (empty) database:
--   psql -U <user> -d stockout_tracker -f schema.sql

CREATE TABLE IF NOT EXISTS stockout_items (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  product_line      TEXT NOT NULL,
  lead_time         INTEGER NOT NULL,
  approx_ship_date  TEXT NOT NULL,
  escalation_owner  TEXT NOT NULL,
  top_level         TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS future_stockout_items (
  id                      SERIAL PRIMARY KEY,
  part_number             TEXT NOT NULL,
  name                    TEXT NOT NULL,
  product_line            TEXT NOT NULL,
  estimated_weeks_on_hand NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  first_name     TEXT NOT NULL DEFAULT '',
  last_name      TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  is_root        BOOLEAN NOT NULL DEFAULT FALSE
);

-- The "session" table is created automatically by connect-pg-simple
-- (createTableIfMissing: true in server/index.ts) — no action needed here.
