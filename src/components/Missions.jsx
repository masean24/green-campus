import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, MapPin, Award, Filter } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Missions = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [completedMissionIds, setCompletedMissionIds] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
    fetchCompletedMissions();
  }, [profile]);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('active', true)
        .order('points', { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedMissions = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_missions')
        .select('mission_id')
        .eq('user_id', profile.id);

      if (error) throw error;
      setCompletedMissionIds(data.map(m => m.mission_id));
    } catch (error) {
      console.error('Error fetching completed missions:', error);
    }
  };

  const categoryColors = {
    "Waste Management": "bg-green-100 text-green-700",
    "Plastic Reduction": "bg-blue-100 text-blue-700",
    "Energy Saving": "bg-yellow-100 text-yellow-700",
    "Transportation": "bg-purple-100 text-purple-700",
    "Reforestation": "bg-emerald-100 text-emerald-700",
  };

  const availableMissions = missions.filter(m => !completedMissionIds.includes(m.id));
  const completedMissions = missions.filter(m => completedMissionIds.includes(m.id));
  const displayMissions = filter === 'completed' ? completedMissions : availableMissions;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
          <Leaf className="w-8 h-8" />
          Misi Hijau
        </h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <Filter className="w-4 h-4 mr-1" />
            Tersedia ({availableMissions.length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Selesai ({completedMissions.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayMissions.map((mission, index) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{mission.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{mission.description}</p>
                    <Badge className={categoryColors[mission.category] || "bg-gray-100"}>
                      {mission.category}
                    </Badge>
                  </div>
                  <div className="text-center ml-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-primary">+{mission.points}</p>
                    <p className="text-xs text-gray-600">poin</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{mission.location}</span>
                </div>

                {filter === 'all' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark"
                    onClick={() => navigate('/scan-qr', { state: { mission } })}
                  >
                    <Leaf className="w-4 h-4 mr-2" />
                    Kerjakan Misi
                  </Button>
                )}

                {filter === 'completed' && (
                  <div className="bg-green-50 text-green-700 py-2 px-4 rounded-lg text-center font-semibold">
                    ✓ Selesai
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {displayMissions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {filter === 'completed' ? '📋' : '🎉'}
          </div>
          <p className="text-gray-500 text-lg">
            {filter === 'completed' 
              ? 'Belum ada misi yang diselesaikan. Yuk mulai sekarang!'
              : 'Semua misi telah selesai! Hebat! 🎉'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Missions;
