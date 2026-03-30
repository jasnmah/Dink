import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

interface StatsScreenProps {
  currentUserId: string;
  selectedParkId: string;
}

interface GameWithPlayers {
  id: string;
  team1_score: number;
  team2_score: number;
  played_at: string;
  team1_player1: User;
  team1_player2: User;
  team2_player1: User;
  team2_player2: User;
}

export function StatsScreen({ currentUserId, selectedParkId }: StatsScreenProps) {
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [bestPartner, setBestPartner] = useState<{ user: User; winRate: number; games: number } | null>(null);
  const [toughestOpponent, setToughestOpponent] = useState<{ user: User; lossRate: number; games: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [currentUserId, selectedParkId]);

  const loadStats = async () => {
    setLoading(true);

    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('park_id', selectedParkId)
      .or(`team1_player1_id.eq.${currentUserId},team1_player2_id.eq.${currentUserId},team2_player1_id.eq.${currentUserId},team2_player2_id.eq.${currentUserId}`)
      .order('played_at', { ascending: false })
      .limit(10);

    if (gamesData && gamesData.length > 0) {
      const playerIds = new Set<string>();
      gamesData.forEach((g) => {
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

      const gamesWithPlayers = gamesData.map((g) => ({
        ...g,
        team1_player1: usersMap.get(g.team1_player1_id)!,
        team1_player2: usersMap.get(g.team1_player2_id)!,
        team2_player1: usersMap.get(g.team2_player1_id)!,
        team2_player2: usersMap.get(g.team2_player2_id)!,
      }));

      setGames(gamesWithPlayers);

      const { data: allGames } = await supabase
        .from('games')
        .select('*')
        .eq('park_id', selectedParkId)
        .or(`team1_player1_id.eq.${currentUserId},team1_player2_id.eq.${currentUserId},team2_player1_id.eq.${currentUserId},team2_player2_id.eq.${currentUserId}`);

      if (allGames) {
        calculateBestPartner(allGames, usersMap);
        calculateToughestOpponent(allGames, usersMap);
      }
    }

    setLoading(false);
  };

  const calculateBestPartner = (games: any[], usersMap: Map<string, User>) => {
    const partnerStats = new Map<string, { wins: number; total: number }>();

    games.forEach((g) => {
      let partnerId: string | null = null;
      let won = false;

      if (g.team1_player1_id === currentUserId) {
        partnerId = g.team1_player2_id;
        won = g.team1_score > g.team2_score;
      } else if (g.team1_player2_id === currentUserId) {
        partnerId = g.team1_player1_id;
        won = g.team1_score > g.team2_score;
      } else if (g.team2_player1_id === currentUserId) {
        partnerId = g.team2_player2_id;
        won = g.team2_score > g.team1_score;
      } else if (g.team2_player2_id === currentUserId) {
        partnerId = g.team2_player1_id;
        won = g.team2_score > g.team1_score;
      }

      if (partnerId) {
        if (!partnerStats.has(partnerId)) {
          partnerStats.set(partnerId, { wins: 0, total: 0 });
        }
        const stats = partnerStats.get(partnerId)!;
        stats.total++;
        if (won) stats.wins++;
      }
    });

    const bestPartnerEntry = Array.from(partnerStats.entries())
      .filter(([_, stats]) => stats.total >= 2)
      .sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total)[0];

    if (bestPartnerEntry) {
      const [partnerId, stats] = bestPartnerEntry;
      const user = usersMap.get(partnerId);
      if (user) {
        setBestPartner({
          user,
          winRate: (stats.wins / stats.total) * 100,
          games: stats.total,
        });
      }
    }
  };

  const calculateToughestOpponent = (games: any[], usersMap: Map<string, User>) => {
    const opponentStats = new Map<string, { losses: number; total: number }>();

    games.forEach((g) => {
      const isTeam1 = g.team1_player1_id === currentUserId || g.team1_player2_id === currentUserId;
      const won = isTeam1 ? g.team1_score > g.team2_score : g.team2_score > g.team1_score;

      const opponentIds = isTeam1
        ? [g.team2_player1_id, g.team2_player2_id]
        : [g.team1_player1_id, g.team1_player2_id];

      opponentIds.forEach((opponentId) => {
        if (!opponentStats.has(opponentId)) {
          opponentStats.set(opponentId, { losses: 0, total: 0 });
        }
        const stats = opponentStats.get(opponentId)!;
        stats.total++;
        if (!won) stats.losses++;
      });
    });

    const toughestOpponentEntry = Array.from(opponentStats.entries())
      .filter(([_, stats]) => stats.total >= 2)
      .sort((a, b) => b[1].losses / b[1].total - a[1].losses / a[1].total)[0];

    if (toughestOpponentEntry) {
      const [opponentId, stats] = toughestOpponentEntry;
      const user = usersMap.get(opponentId);
      if (user) {
        setToughestOpponent({
          user,
          lossRate: (stats.losses / stats.total) * 100,
          games: stats.total,
        });
      }
    }
  };

  const isWin = (game: GameWithPlayers) => {
    const isTeam1 =
      game.team1_player1.id === currentUserId || game.team1_player2.id === currentUserId;
    return isTeam1 ? game.team1_score > game.team2_score : game.team2_score > game.team1_score;
  };

  const getPartner = (game: GameWithPlayers) => {
    if (game.team1_player1.id === currentUserId) return game.team1_player2;
    if (game.team1_player2.id === currentUserId) return game.team1_player1;
    if (game.team2_player1.id === currentUserId) return game.team2_player2;
    return game.team2_player1;
  };

  const getOpponents = (game: GameWithPlayers) => {
    const isTeam1 =
      game.team1_player1.id === currentUserId || game.team1_player2.id === currentUserId;
    return isTeam1
      ? [game.team2_player1, game.team2_player2]
      : [game.team1_player1, game.team1_player2];
  };

  const getScore = (game: GameWithPlayers) => {
    const isTeam1 =
      game.team1_player1.id === currentUserId || game.team1_player2.id === currentUserId;
    return isTeam1
      ? `${game.team1_score}-${game.team2_score}`
      : `${game.team2_score}-${game.team1_score}`;
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
          <h1 className="text-2xl font-bold">Your Stats</h1>
          <p className="text-sm text-white/80 mt-1">Performance insights</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {bestPartner && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Award size={18} />
                  <span className="text-xs font-semibold">Best Partner</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">{bestPartner.user.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {bestPartner.winRate.toFixed(0)}% wins
                </p>
                <p className="text-xs text-gray-500">{bestPartner.games} games</p>
              </div>
            )}

            {toughestOpponent && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <Target size={18} />
                  <span className="text-xs font-semibold">Toughest Foe</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">{toughestOpponent.user.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {toughestOpponent.lossRate.toFixed(0)}% losses
                </p>
                <p className="text-xs text-gray-500">{toughestOpponent.games} games</p>
              </div>
            )}
          </div>

          {games.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Games</h2>
              <div className="space-y-2">
                {games.map((game) => {
                  const won = isWin(game);
                  const partner = getPartner(game);
                  const opponents = getOpponents(game);
                  const score = getScore(game);

                  return (
                    <div
                      key={game.id}
                      className={`rounded-xl p-4 border-2 ${
                        won
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {won ? (
                            <TrendingUp className="text-green-600" size={18} />
                          ) : (
                            <TrendingDown className="text-red-600" size={18} />
                          )}
                          <span
                            className={`font-bold text-sm ${
                              won ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {won ? 'Win' : 'Loss'}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">{score}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Partner:</span> {partner.name}
                        </p>
                        <p>
                          <span className="font-medium">vs</span> {opponents[0].name},{' '}
                          {opponents[1].name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(game.played_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {games.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-2">
                <TrendingUp size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No games yet</p>
              <p className="text-sm text-gray-500 mt-1">Start playing to see your stats!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
