import { useEffect, useState } from 'react';
import { supabase, Park, User } from '../lib/supabase';
import { TrendingUp, TrendingDown, Flame, Users } from 'lucide-react';

interface HomeScreenProps {
  currentUserId: string;
  selectedParkId: string;
  onParkChange: (parkId: string) => void;
}

interface PlayerStats {
  rank: number;
  winRate: number;
  streak: number;
  gamesPlayed: number;
  insights: string[];
}

export function HomeScreen({ currentUserId, selectedParkId, onParkChange }: HomeScreenProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUserId, selectedParkId]);

  const loadData = async () => {
    setLoading(true);

    const [parksData, userData] = await Promise.all([
      supabase.from('parks').select('*').order('name'),
      supabase.from('users').select('*').eq('id', currentUserId).maybeSingle(),
    ]);

    if (parksData.data) setParks(parksData.data);
    if (userData.data) setCurrentUser(userData.data);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('park_id', selectedParkId)
      .gte('played_at', weekAgo.toISOString())
      .order('played_at', { ascending: false });

    if (games) {
      const playerStats = calculateStats(games, currentUserId);
      setStats(playerStats);
    }

    setLoading(false);
  };

  const calculateStats = (games: any[], playerId: string): PlayerStats => {
    const playerGames = games.filter(
      (g) =>
        g.team1_player1_id === playerId ||
        g.team1_player2_id === playerId ||
        g.team2_player1_id === playerId ||
        g.team2_player2_id === playerId
    );

    const wins = playerGames.filter((g) => {
      const isTeam1 = g.team1_player1_id === playerId || g.team1_player2_id === playerId;
      return isTeam1 ? g.team1_score > g.team2_score : g.team2_score > g.team1_score;
    }).length;

    const winRate = playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0;

    let streak = 0;
    for (const game of playerGames) {
      const isTeam1 = game.team1_player1_id === playerId || game.team1_player2_id === playerId;
      const won = isTeam1 ? game.team1_score > game.team2_score : game.team2_score > game.team1_score;
      if (won) {
        streak++;
      } else {
        break;
      }
    }

    const allPlayerGames = games.filter(
      (g) =>
        g.team1_player1_id !== playerId &&
        g.team1_player2_id !== playerId &&
        g.team2_player1_id !== playerId &&
        g.team2_player2_id !== playerId
    );

    const allPlayers = new Map<string, { wins: number; total: number }>();
    games.forEach((g) => {
      const players = [g.team1_player1_id, g.team1_player2_id, g.team2_player1_id, g.team2_player2_id];
      players.forEach((p) => {
        if (!allPlayers.has(p)) {
          allPlayers.set(p, { wins: 0, total: 0 });
        }
        const stats = allPlayers.get(p)!;
        stats.total++;
        const isTeam1 = g.team1_player1_id === p || g.team1_player2_id === p;
        if ((isTeam1 && g.team1_score > g.team2_score) || (!isTeam1 && g.team2_score > g.team1_score)) {
          stats.wins++;
        }
      });
    });

    const qualifiedPlayers = Array.from(allPlayers.entries())
      .filter(([_, stats]) => stats.total >= 5)
      .sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total);

    const rank = qualifiedPlayers.findIndex(([id]) => id === playerId) + 1;

    const insights = generateInsights(playerGames, playerId);

    return {
      rank: rank || 0,
      winRate,
      streak,
      gamesPlayed: playerGames.length,
      insights,
    };
  };

  const generateInsights = (games: any[], playerId: string): string[] => {
    const insights: string[] = [];

    const partnerStats = new Map<string, { wins: number; total: number; name: string }>();

    games.forEach((g) => {
      let partnerId: string | null = null;
      let won = false;

      if (g.team1_player1_id === playerId) {
        partnerId = g.team1_player2_id;
        won = g.team1_score > g.team2_score;
      } else if (g.team1_player2_id === playerId) {
        partnerId = g.team1_player1_id;
        won = g.team1_score > g.team2_score;
      } else if (g.team2_player1_id === playerId) {
        partnerId = g.team2_player2_id;
        won = g.team2_score > g.team1_score;
      } else if (g.team2_player2_id === playerId) {
        partnerId = g.team2_player1_id;
        won = g.team2_score > g.team1_score;
      }

      if (partnerId) {
        if (!partnerStats.has(partnerId)) {
          partnerStats.set(partnerId, { wins: 0, total: 0, name: '' });
        }
        const stats = partnerStats.get(partnerId)!;
        stats.total++;
        if (won) stats.wins++;
      }
    });

    const bestPartner = Array.from(partnerStats.entries())
      .filter(([_, stats]) => stats.total >= 2)
      .sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total)[0];

    if (bestPartner) {
      const winPct = Math.round((bestPartner[1].wins / bestPartner[1].total) * 100);
      insights.push(`You win ${winPct}% with partner ${bestPartner[0].substring(0, 8)}`);
    }

    if (games.length >= 3) {
      const recentGames = games.slice(0, 3);
      const recentWins = recentGames.filter((g) => {
        const isTeam1 = g.team1_player1_id === playerId || g.team1_player2_id === playerId;
        return isTeam1 ? g.team1_score > g.team2_score : g.team2_score > g.team1_score;
      }).length;

      if (recentWins === 3) {
        insights.push('On fire! 3 wins in a row');
      } else if (recentWins === 0) {
        insights.push('Tough stretch - keep grinding');
      }
    }

    const avgScoreDiff = games.reduce((acc, g) => {
      const isTeam1 = g.team1_player1_id === playerId || g.team1_player2_id === playerId;
      const diff = isTeam1
        ? g.team1_score - g.team2_score
        : g.team2_score - g.team1_score;
      return acc + diff;
    }, 0) / games.length;

    if (avgScoreDiff > 3) {
      insights.push('Dominating with big wins');
    } else if (avgScoreDiff > 0 && avgScoreDiff <= 2) {
      insights.push('Close games - clutch performer');
    }

    return insights.slice(0, 3);
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
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Pickleball Tracker</h1>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <label className="text-xs font-medium text-white/80 block mb-1">Your Park</label>
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
        </div>

        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Weekly Rank</div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats?.rank && stats.rank > 0 ? `#${stats.rank}` : '-'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Win Rate</div>
                <div className="text-3xl font-bold text-green-900">
                  {stats?.winRate.toFixed(0)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="text-sm text-orange-600 font-medium mb-1 flex items-center gap-1">
                  <Flame size={14} />
                  Streak
                </div>
                <div className="text-3xl font-bold text-orange-900">{stats?.streak || 0}</div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="text-sm text-gray-600 font-medium mb-1 flex items-center gap-1">
                  <Users size={14} />
                  Games
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats?.gamesPlayed || 0}</div>
              </div>
            </div>
          </div>

          {stats && stats.insights.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Insights</h2>
              <div className="space-y-2">
                {stats.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 border border-gray-100"
                  >
                    {insight.includes('fire') || insight.includes('win') ? (
                      <TrendingUp className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    ) : (
                      <TrendingDown className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
                    )}
                    <p className="text-sm text-gray-700 font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.gamesPlayed === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Users size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No games logged this week</p>
              <p className="text-sm text-gray-500 mt-1">Start playing and log your first game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
