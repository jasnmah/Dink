import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Park {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Game {
  id: string;
  park_id: string;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_score: number;
  team2_score: number;
  played_at: string;
  logged_by: string;
  created_at: string;
}
