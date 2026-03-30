import { useEffect, useState } from 'react';
import { supabase, Park, User } from '../lib/supabase';
import { Check } from 'lucide-react';

interface LogGameScreenProps {
  currentUserId: string;
  selectedParkId: string;
}

export function LogGameScreen({ currentUserId, selectedParkId }: LogGameScreenProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [parkId, setParkId] = useState(selectedParkId);
  const [partnerId, setPartnerId] = useState('');
  const [opponent1Id, setOpponent1Id] = useState('');
  const [opponent2Id, setOpponent2Id] = useState('');
  const [yourScore, setYourScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [parksData, usersData] = await Promise.all([
      supabase.from('parks').select('*').order('name'),
      supabase.from('users').select('*').order('name'),
    ]);

    if (parksData.data) setParks(parksData.data);
    if (usersData.data) {
      setUsers(usersData.data.filter((u) => u.id !== currentUserId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerId || !opponent1Id || !opponent2Id || !yourScore || !opponentScore) {
      alert('Please fill in all fields');
      return;
    }

    if (partnerId === opponent1Id || partnerId === opponent2Id || opponent1Id === opponent2Id) {
      alert('Please select different players for each position');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('games').insert({
      park_id: parkId,
      team1_player1_id: currentUserId,
      team1_player2_id: partnerId,
      team2_player1_id: opponent1Id,
      team2_player2_id: opponent2Id,
      team1_score: parseInt(yourScore),
      team2_score: parseInt(opponentScore),
      logged_by: currentUserId,
      played_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      alert('Error saving game: ' + error.message);
      return;
    }

    setShowSuccess(true);
    setPartnerId('');
    setOpponent1Id('');
    setOpponent2Id('');
    setYourScore('');
    setOpponentScore('');

    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <h1 className="text-2xl font-bold">Log Game</h1>
          <p className="text-sm text-white/80 mt-1">Quick entry for your match</p>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Park</label>
              <select
                value={parkId}
                onChange={(e) => setParkId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {parks.map((park) => (
                  <option key={park.id} value={park.id}>
                    {park.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Team</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Your Partner
                  </label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select partner</option>
                    {users
                      .filter((u) => u.id !== opponent1Id && u.id !== opponent2Id)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Opponents</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Opponent 1
                  </label>
                  <select
                    value={opponent1Id}
                    onChange={(e) => setOpponent1Id(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select opponent</option>
                    {users
                      .filter((u) => u.id !== partnerId && u.id !== opponent2Id)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Opponent 2
                  </label>
                  <select
                    value={opponent2Id}
                    onChange={(e) => setOpponent2Id(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select opponent</option>
                    {users
                      .filter((u) => u.id !== partnerId && u.id !== opponent1Id)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Final Score</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Your Team
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={yourScore}
                    onChange={(e) => setYourScore(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Opponents
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Game'}
            </button>
          </form>

          {showSuccess && (
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-bounce">
              <Check size={20} />
              <span className="font-medium">Game saved!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
