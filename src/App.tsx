import { useEffect, useState } from 'react';
import { supabase, User, Park } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { LogGameScreen } from './screens/LogGameScreen';
import { StatsScreen } from './screens/StatsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'log' | 'stats' | 'leaderboard'>('home');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedParkId, setSelectedParkId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [usersData, parksData] = await Promise.all([
      supabase.from('users').select('*').order('name'),
      supabase.from('parks').select('*').order('name'),
    ]);

    if (usersData.data && usersData.data.length > 0) {
      setUsers(usersData.data);
      setCurrentUserId(usersData.data[0].id);
    }

    if (parksData.data && parksData.data.length > 0) {
      setParks(parksData.data);
      setSelectedParkId(parksData.data[0].id);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId || !selectedParkId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Pickleball Tracker</h2>
          <p className="text-gray-600 mb-6">Please set up your profile to get started</p>
          <button
            onClick={loadInitialData}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                Playing as: {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-16">
        {currentScreen === 'home' && (
          <HomeScreen
            currentUserId={currentUserId}
            selectedParkId={selectedParkId}
            onParkChange={setSelectedParkId}
          />
        )}
        {currentScreen === 'log' && (
          <LogGameScreen
            currentUserId={currentUserId}
            selectedParkId={selectedParkId}
          />
        )}
        {currentScreen === 'stats' && (
          <StatsScreen
            currentUserId={currentUserId}
            selectedParkId={selectedParkId}
          />
        )}
        {currentScreen === 'leaderboard' && (
          <LeaderboardScreen
            currentUserId={currentUserId}
            selectedParkId={selectedParkId}
            onParkChange={setSelectedParkId}
          />
        )}
      </div>

      <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
    </div>
  );
}

export default App;
