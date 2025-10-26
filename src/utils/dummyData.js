export const missions = [
  {
    id: 1,
    title: "Buang Sampah Terpilah",
    description: "Buang sampah organik dan anorganik pada tempatnya",
    points: 10,
    location: "Area Kampus",
    category: "Waste Management",
    qrCode: "MISSION_001",
  },
  {
    id: 2,
    title: "Bawa Tumbler Sendiri",
    description: "Gunakan tumbler pribadi untuk mengurangi sampah plastik",
    points: 15,
    location: "Kantin",
    category: "Plastic Reduction",
    qrCode: "MISSION_002",
  },
  {
    id: 3,
    title: "Hemat Listrik",
    description: "Matikan lampu dan AC saat tidak digunakan",
    points: 20,
    location: "Ruang Kelas",
    category: "Energy Saving",
    qrCode: "MISSION_003",
  },
  {
    id: 4,
    title: "Gunakan Transportasi Umum",
    description: "Datang ke kampus menggunakan transportasi umum atau sepeda",
    points: 25,
    location: "Gerbang Kampus",
    category: "Transportation",
    qrCode: "MISSION_004",
  },
  {
    id: 5,
    title: "Tanam Pohon",
    description: "Ikut serta dalam program penanaman pohon kampus",
    points: 50,
    location: "Taman Kampus",
    category: "Reforestation",
    qrCode: "MISSION_005",
  },
];

export const rewards = [
  {
    id: 1,
    name: "Diskon Kantin 20%",
    description: "Voucher diskon 20% di kantin kampus",
    points: 100,
    stock: 50,
    category: "Diskon",
    image: "🎫",
  },
  {
    id: 2,
    name: "Merchandise Kampus",
    description: "T-shirt atau tote bag Green Campus",
    points: 250,
    stock: 20,
    category: "Merchandise",
    image: "🎁",
  },
  {
    id: 3,
    name: "Free Coffee Week",
    description: "Gratis kopi di kantin selama seminggu",
    points: 150,
    stock: 30,
    category: "Voucher",
    image: "☕",
  },
  {
    id: 4,
    name: "Green Campus Badge",
    description: "Badge eksklusif untuk profil kampus",
    points: 300,
    stock: 15,
    category: "Badge",
    image: "🏆",
  },
  {
    id: 5,
    name: "Parkir Gratis 1 Bulan",
    description: "Gratis parkir motor selama 1 bulan",
    points: 500,
    stock: 10,
    category: "Parking",
    image: "🅿️",
  },
];

export const leaderboardData = [
  {
    id: 1,
    name: "Ahmad Rifai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad",
    points: 850,
    level: 17,
    completedMissions: 42,
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti",
    points: 720,
    level: 14,
    completedMissions: 36,
  },
  {
    id: 3,
    name: "Budi Santoso",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
    points: 680,
    level: 13,
    completedMissions: 34,
  },
  {
    id: 4,
    name: "Dewi Lestari",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi",
    points: 590,
    level: 11,
    completedMissions: 29,
  },
  {
    id: 5,
    name: "Rudi Hermawan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rudi",
    points: 540,
    level: 10,
    completedMissions: 27,
  },
];

export const badges = [
  {
    id: 1,
    name: "Eco Starter",
    description: "Selesaikan 5 misi pertama",
    requiredPoints: 50,
    icon: "🌱",
  },
  {
    id: 2,
    name: "Eco Hero",
    description: "Kumpulkan 200 poin",
    requiredPoints: 200,
    icon: "🦸",
  },
  {
    id: 3,
    name: "Green Master",
    description: "Capai level 10",
    requiredPoints: 500,
    icon: "👑",
  },
  {
    id: 4,
    name: "Planet Saver",
    description: "Kumpulkan 1000 poin",
    requiredPoints: 1000,
    icon: "🌍",
  },
];

export const calculateLevel = (points) => {
  return Math.floor(points / 50) + 1;
};

export const getNextLevelPoints = (currentPoints) => {
  const currentLevel = calculateLevel(currentPoints);
  return currentLevel * 50;
};

export const getProgressToNextLevel = (points) => {
  const pointsInCurrentLevel = points % 50;
  return (pointsInCurrentLevel / 50) * 100;
};
