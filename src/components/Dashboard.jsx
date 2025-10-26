import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Leaf, Award, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchRecentActivities();
      calculateBadges();
    }
  }, [profile]);

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_missions')
        .select(`
          *,
          missions (title, points)
        `)
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const calculateBadges = () => {
    const earnedBadges = [];
    if (profile.points >= 50) {
      earnedBadges.push({ id: 1, name: 'Eco Starter', icon: '🌱', description: '50+ poin' });
    }
    if (profile.points >= 200) {
      earnedBadges.push({ id: 2, name: 'Eco Hero', icon: '🦸', description: '200+ poin' });
    }
    if (profile.points >= 500) {
      earnedBadges.push({ id: 3, name: 'Green Master', icon: '👑', description: '500+ poin' });
    }
    if (profile.points >= 1000) {
      earnedBadges.push({ id: 4, name: 'Planet Saver', icon: '🌍', description: '1000+ poin' });
    }
    setBadges(earnedBadges);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const level = Math.floor(profile.points / 50) + 1;
  const nextLevelPoints = level * 50;
  const progress = ((profile.points % 50) / 50) * 100;

  const stats = [
    { 
      icon: Trophy, 
      label: "Total Poin", 
      value: profile.points, 
      color: "#FFD700",
      bg: "bg-yellow-50"
    },
    { 
      icon: Award, 
      label: "Level", 
      value: level, 
      color: "#4CAF50",
      bg: "bg-green-50"
    },
    { 
      icon: Leaf, 
      label: "Misi Selesai", 
      value: profile.completed_missions, 
      color: "#A5D6A7",
      bg: "bg-green-100"
    },
    { 
      icon: TrendingUp, 
      label: "Badge", 
      value: badges.length, 
      color: "#2196F3",
      bg: "bg-blue-50"
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left"
      >
        <h1 className="text-3xl font-bold text-primary">
          Selamat Datang, {profile.name}! 🌱
        </h1>
        <p className="text-gray-600 mt-2">Mari berkontribusi untuk kampus hijau</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${stat.bg}`} style={{ borderLeftColor: stat.color }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-8 h-8 md:w-10 md:h-10" style={{ color: stat.color }} />
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progress ke Level {level + 1}</span>
              <span className="text-sm font-normal text-gray-600">
                {profile.points}/{nextLevelPoints} poin
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3 mb-2" />
            <p className="text-sm text-gray-600">
              {nextLevelPoints - profile.points} poin lagi untuk level berikutnya
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Badge yang Diraih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {activity.missions?.title || 'Misi Selesai'}
                      </p>
                      <p className="text-xs text-gray-600">
                        +{activity.points_earned} poin
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(activity.completed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
