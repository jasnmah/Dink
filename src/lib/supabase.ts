import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdqpgbusqskuionownwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXBnYnVzcXNrdWlvbm93bndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MzI1MjMsImV4cCI6MjA5MDQwODUyM30.djl7f1uZJVN00LT6m1AQZD-rMubMaPxYQLsi064GtdU';

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
