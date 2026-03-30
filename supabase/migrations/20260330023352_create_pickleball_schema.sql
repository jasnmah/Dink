/*
  # Pickleball App Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, user's display name)
      - `created_at` (timestamptz, when user joined)
    
    - `parks`
      - `id` (uuid, primary key)
      - `name` (text, park name)
      - `location` (text, park location/address)
      - `created_at` (timestamptz)
    
    - `games`
      - `id` (uuid, primary key)
      - `park_id` (uuid, references parks)
      - `team1_player1_id` (uuid, references users)
      - `team1_player2_id` (uuid, references users)
      - `team2_player1_id` (uuid, references users)
      - `team2_player2_id` (uuid, references users)
      - `team1_score` (integer)
      - `team2_score` (integer)
      - `played_at` (timestamptz, when game was played)
      - `logged_by` (uuid, references users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for all tables (since this is a community app)
    - Authenticated users can insert games and create users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id uuid REFERENCES parks(id) NOT NULL,
  team1_player1_id uuid REFERENCES users(id) NOT NULL,
  team1_player2_id uuid REFERENCES users(id) NOT NULL,
  team2_player1_id uuid REFERENCES users(id) NOT NULL,
  team2_player2_id uuid REFERENCES users(id) NOT NULL,
  team1_score integer NOT NULL,
  team2_score integer NOT NULL,
  played_at timestamptz DEFAULT now(),
  logged_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view parks"
  ON parks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create parks"
  ON parks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Anyone can log games"
  ON games FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS games_park_id_idx ON games(park_id);
CREATE INDEX IF NOT EXISTS games_played_at_idx ON games(played_at);
CREATE INDEX IF NOT EXISTS games_team1_player1_idx ON games(team1_player1_id);
CREATE INDEX IF NOT EXISTS games_team1_player2_idx ON games(team1_player2_id);
CREATE INDEX IF NOT EXISTS games_team2_player1_idx ON games(team2_player1_id);
CREATE INDEX IF NOT EXISTS games_team2_player2_idx ON games(team2_player2_id);

INSERT INTO parks (name, location) VALUES
  ('Riverside Park', '123 River St'),
  ('Sunset Courts', '456 Sunset Blvd'),
  ('Downtown Recreation Center', '789 Main St')
ON CONFLICT DO NOTHING;

INSERT INTO users (name) VALUES
  ('Alex'),
  ('Jordan'),
  ('Taylor'),
  ('Casey'),
  ('Morgan'),
  ('Kevin'),
  ('Sam'),
  ('Riley')
ON CONFLICT DO NOTHING;