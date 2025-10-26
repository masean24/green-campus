import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('greenCampusUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('greenCampusUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('greenCampusUser');
    }
  }, [user]);

  const login = (userData) => {
    const userWithDefaults = {
      ...userData,
      points: userData.points || 0,
      completedMissions: userData.completedMissions || 0,
      badges: userData.badges || [],
      redeemedRewards: userData.redeemedRewards || [],
    };
    setUser(userWithDefaults);
  };

  const logout = () => {
    setUser(null);
  };

  const addPoints = (points, missionId) => {
    setUser(prev => ({
      ...prev,
      points: prev.points + points,
      completedMissions: prev.completedMissions + 1,
      completedMissionIds: [...(prev.completedMissionIds || []), missionId],
    }));
  };

  const redeemReward = (reward) => {
    if (user.points >= reward.points) {
      setUser(prev => ({
        ...prev,
        points: prev.points - reward.points,
        redeemedRewards: [...prev.redeemedRewards, { ...reward, date: new Date() }],
      }));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addPoints, redeemReward }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
