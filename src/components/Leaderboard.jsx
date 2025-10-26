import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Leaderboard = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <div className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">#{rank}</div>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
    return 'bg-white';
  };

  const calculateLevel = (points) => {
    return Math.floor(points / 50) + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center justify-center md:justify-start gap-2">
          <Trophy className="w-8 h-8" />
          Leaderboard
        </h1>
        <p className="text-gray-600 mt-2">Peringkat mahasiswa paling aktif</p>
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((idx) => {
            const userData = users[idx];
            const rank = idx + 1;
            const level = calculateLevel(userData.points);
            
            return (
              <motion.div
                key={userData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`${rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}
              >
                <Card className={`${getRankBg(rank)} border-2`}>
                  <CardContent className="p-4">
                    <div className="relative inline-block mb-2 mx-auto block">
                      <img
                        src={userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`}
                        alt={userData.name}
                        className={`rounded-full mx-auto ${rank === 1 ? 'w-20 h-20' : 'w-16 h-16'}`}
                      />
                      <div className="absolute -top-2 -right-2">
                        {rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                        {rank !== 1 && getRankIcon(rank)}
                      </div>
                    </div>
                    <p className={`font-bold ${rank === 1 ? 'text-base' : 'text-sm'} truncate text-center`}>
                      {userData.name.split(' ')[0]}
                    </p>
                    <p className={`font-bold text-primary ${rank === 1 ? 'text-xl' : 'text-lg'} text-center`}>
                      {userData.points}
                    </p>
                    <p className="text-xs text-gray-600 text-center">Level {level}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="space-y-3">
        {users.map((userData, index) => {
          const rank = index + 1;
          const level = calculateLevel(userData.points);
          const isCurrentUser = userData.id === profile?.id;

          return (
            <motion.div
              key={userData.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`${getRankBg(rank)} ${
                isCurrentUser ? 'ring-2 ring-primary' : ''
              } hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    <img
                      src={userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`}
                      alt={userData.name}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{userData.name}</p>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>Level {level}</span>
                        <span>•</span>
                        <span>{userData.completed_missions} misi</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary">{userData.points}</p>
                      <p className="text-xs text-gray-600">poin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-500 text-lg">Belum ada data leaderboard</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
