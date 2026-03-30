import { useEffect, useState } from 'react';
import { supabase, User, Park } from '../lib/supabase';
import { Trophy, Flame, TrendingUp } from 'lucide-react';

interface LeaderboardScreenProps {
  currentUserId: string;
  selectedParkId: string;
  onParkChange: (parkId: string) => void;
}

interface LeaderboardEntry {
  user: User;
  rank: number;
  winRate: number;
  gamesPlayed: number;
  streak: number;
  wins: number;
}

export function LeaderboardScreen({ currentUserId, selectedParkId, onParkChange }: LeaderboardScreenProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedParkId]);

  const loadLeaderboard = async () => {
    setLoading(true);

    const { data: parksData } = await supabase.from('parks').select('*').order('name');
    if (parksData) setParks(parksData);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('park_id', selectedParkId)
      .gte('played_at', weekAgo.toISOString())
      .order('played_at', { ascending: false });

    if (games && games.length > 0) {
      const playerIds = new Set<string>();
      games.forEach((g) => {
        playerIds.add(g.team1_player1_id);
        playerIds.add(g.team1_player2_id);
        playerIds.add(g.team2_player1_id);
        playerIds.add(g.team2_player2_id);
      });

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .in('id', Array.from(playerIds));

      const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

      const playerStats = new Map<string, { wins: number; total: number; games: any[] }>();

      games.forEach((g) => {
        const players = [
          g.team1_player1_id,
          g.team1_player2_id,
          g.team2_player1_id,
          g.team2_player2_id,
        ];

        players.forEach((playerId) => {
          if (!playerStats.has(playerId)) {
            playerStats.set(playerId, { wins: 0, total: 0, games: [] });
          }
          const stats = playerStats.get(playerId)!;
          stats.total++;
          stats.games.push(g);

          const isTeam1 = g.team1_player1_id === playerId || g.team1_player2_id === playerId;
          const won = isTeam1 ? g.team1_score > g.team2_score : g.team2_score > g.team1_score;
          if (won) stats.wins++;
        });
      });

      const leaderboardEntries: LeaderboardEntry[] = Array.from(playerStats.entries())
        .filter(([_, stats]) => stats.total >= 5)
        .map(([playerId, stats]) => {
          let streak = 0;
          const sortedGames = stats.games.sort(
            (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
          );

          for (const game of sortedGames) {
            const isTeam1 =
              game.team1_player1_id === playerId || game.team1_player2_id === playerId;
            const won = isTeam1
              ? game.team1_score > game.team2_score
              : game.team2_score > game.team1_score;
            if (won) {
              streak++;
            } else {
              break;
            }
          }

          return {
            user: usersMap.get(playerId)!,
            rank: 0,
            winRate: (stats.wins / stats.total) * 100,
            gamesPlayed: stats.total,
            streak,
            wins: stats.wins,
          };
        })
        .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(leaderboardEntries);
    } else {
      setLeaderboard([]);
    }

    setLoading(false);
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={28} />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <label className="text-xs font-medium text-white/80 block mb-1">Select Park</label>
            <select
              value={selectedParkId}
              onChange={(e) => onParkChange(e.target.value)}
              className="w-full bg-white/90 text-gray-900 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
            >
              {parks.map((park) => (
                <option key={park.id} value={park.id}>
                  {park.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-white/70 mt-3">
            Weekly rankings • Minimum 5 games to qualify
          </p>
        </div>

        <div className="p-4">
          {leaderboard.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry) => {
                  const medal = getMedalEmoji(entry.rank);
                  const isCurrentUser = entry.user.id === currentUserId;

                  return (
                    <div
                      key={entry.user.id}
                      className={`p-4 flex items-center gap-4 ${
                        isCurrentUser ? 'bg-green-50' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex-shrink-0 w-12 text-center">
                        {medal ? (
                          <span className="text-2xl">{medal}</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold text-gray-900 truncate ${
                              isCurrentUser ? 'text-green-700' : ''
                            }`}
                          >
                            {entry.user.name}
                            {isCurrentUser && (
                              <span className="text-xs ml-2 text-green-600">(You)</span>
                            )}
                          </h3>
                          {entry.streak > 0 && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              <Flame size={12} />
                              <span className="text-xs font-bold">{entry.streak}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">
                            {entry.gamesPlayed} games
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-green-600 mb-1">
                          <TrendingUp size={16} />
                          <span className="text-xl font-bold">
                            {entry.winRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.wins}-{entry.gamesPlayed - entry.wins}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Trophy size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No qualified players yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Players need at least 5 games this week to appear
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
