import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdqpgbusqskuionownwo.supabase.co';
const supabaseAnonKey = 'sb_publishable_UAxvDIUn2pnEUkpB3GIQdA_V8fg2CbH';

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
