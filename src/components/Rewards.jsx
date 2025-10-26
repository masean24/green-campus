import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Rewards = () => {
  const { profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchRewards();
    fetchRedeemedRewards();
  }, [profile]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('points', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedeemedRewards = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('redeemed_rewards')
        .select('reward_id')
        .eq('user_id', profile.id);

      if (error) throw error;
      setRedeemedRewardIds(data.map(r => r.reward_id));
    } catch (error) {
      console.error('Error fetching redeemed rewards:', error);
    }
  };

  const handleRedeem = async (reward) => {
    if (profile.points < reward.points) {
      setNotification({
        type: 'error',
        message: 'Poin tidak cukup! 😢'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (reward.stock <= 0) {
      setNotification({
        type: 'error',
        message: 'Stok habis! 😢'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setRedeeming(true);

    try {
      // Insert redeemed reward
      const { error: insertError } = await supabase
        .from('redeemed_rewards')
        .insert({
          user_id: profile.id,
          reward_id: reward.id,
          points_spent: reward.points
        });

      if (insertError) throw insertError;

      // Update profile points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: profile.points - reward.points
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update reward stock
      const { error: stockError } = await supabase
        .from('rewards')
        .update({
          stock: reward.stock - 1
        })
        .eq('id', reward.id);

      if (stockError) throw stockError;

      // Success
      setNotification({
        type: 'success',
        message: `Berhasil menukar ${reward.name}! 🎉`
      });

      // Refresh data
      refreshProfile();
      fetchRewards();
      fetchRedeemedRewards();

      setTimeout(() => setNotification(null), 3000);

    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menukar reward'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setRedeeming(false);
    }
  };

  const isRedeemed = (rewardId) => {
    return redeemedRewardIds.includes(rewardId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className={`shadow-2xl border-2 ${
              notification.type === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardContent className="p-4 flex items-center gap-3">
                {notification.type === 'success' ? (
                  <Sparkles className="w-6 h-6 text-green-500" />
                ) : (
                  <X className="w-6 h-6 text-red-500" />
                )}
                <p className="font-semibold">{notification.message}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <Gift className="w-8 h-8" />
            Reward Center
          </h1>
          <p className="text-gray-600 mt-1">
            Poin kamu: <span className="font-bold text-primary text-xl">{profile?.points || 0}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward, index) => {
          const canAfford = profile && profile.points >= reward.points;
          const alreadyRedeemed = isRedeemed(reward.id);
          const outOfStock = reward.stock <= 0;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`hover:shadow-lg transition-shadow h-full ${
                !canAfford && !alreadyRedeemed ? 'opacity-60' : ''
              }`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="text-6xl text-center mb-4">{reward.image_emoji}</div>
                  
                  <h3 className="font-bold text-lg mb-2 text-center">{reward.name}</h3>
                  <p className="text-sm text-gray-600 text-center mb-4 flex-grow">
                    {reward.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{reward.category}</Badge>
                    <span className={`text-sm ${
                      reward.stock <= 5 ? 'text-red-600 font-semibold' : 'text-gray-600'
                    }`}>
                      Stok: {reward.stock}
                    </span>
                  </div>

                  <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
                    <p className="text-2xl font-bold text-primary">{reward.points}</p>
                    <p className="text-xs text-gray-600">poin</p>
                  </div>

                  {alreadyRedeemed ? (
                    <div className="bg-green-50 text-green-700 py-3 px-4 rounded-lg text-center font-semibold flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Sudah Ditukar
                    </div>
                  ) : outOfStock ? (
                    <div className="bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-center font-semibold">
                      Stok Habis
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={!canAfford || redeeming}
                      onClick={() => handleRedeem(reward)}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {redeeming ? 'Processing...' : canAfford ? 'Tukar Sekarang' : 'Poin Tidak Cukup'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-500 text-lg">Belum ada reward tersedia</p>
        </div>
      )}
    </div>
  );
};

export default Rewards;
