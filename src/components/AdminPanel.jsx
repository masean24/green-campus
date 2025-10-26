import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, QrCode as QrCodeIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

const AdminPanel = () => {
  const [missions, setMissions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [editingMission, setEditingMission] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Mission Form State
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    points: 0,
    location: '',
    category: '',
    qr_code: '',
    qr_secret: ''
  });

  // Reward Form State
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points: 0,
    stock: 0,
    category: '',
    image_emoji: '🎁'
  });

  useEffect(() => {
    fetchMissions();
    fetchRewards();
  }, []);

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMissions(data || []);
  };

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRewards(data || []);
  };

  // Generate QR Code
  const generateQRCode = async (text) => {
    try {
      const url = await QRCode.toDataURL(text);
      setQrCodeUrl(url);
      return url;
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Mission CRUD
  const handleSaveMission = async () => {
    try {
      if (editingMission) {
        // Update
        const { error } = await supabase
          .from('missions')
          .update(missionForm)
          .eq('id', editingMission.id);
        if (error) throw error;
      } else {
        // Insert
        const qrCode = `QR_${missionForm.category.toUpperCase()}_${Date.now()}`;
        const qrSecret = `secret_${Date.now()}`;
        
        const { error } = await supabase
          .from('missions')
          .insert({
            ...missionForm,
            qr_code: qrCode,
            qr_secret: qrSecret
          });
        if (error) throw error;
        
        // Generate QR code for display
        await generateQRCode(qrCode);
      }
      
      fetchMissions();
      resetMissionForm();
      alert('Misi berhasil disimpan!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteMission = async (id) => {
    if (!confirm('Yakin ingin menghapus misi ini?')) return;
    
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchMissions();
      alert('Misi berhasil dihapus!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const resetMissionForm = () => {
    setMissionForm({
      title: '',
      description: '',
      points: 0,
      location: '',
      category: '',
      qr_code: '',
      qr_secret: ''
    });
    setEditingMission(null);
    setShowMissionForm(false);
    setQrCodeUrl('');
  };

  // Reward CRUD
  const handleSaveReward = async () => {
    try {
      if (editingReward) {
        // Update
        const { error } = await supabase
          .from('rewards')
          .update(rewardForm)
          .eq('id', editingReward.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('rewards')
          .insert(rewardForm);
        if (error) throw error;
      }
      
      fetchRewards();
      resetRewardForm();
      alert('Reward berhasil disimpan!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!confirm('Yakin ingin menghapus reward ini?')) return;
    
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRewards();
      alert('Reward berhasil dihapus!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const resetRewardForm = () => {
    setRewardForm({
      name: '',
      description: '',
      points: 0,
      stock: 0,
      category: '',
      image_emoji: '🎁'
    });
    setEditingReward(null);
    setShowRewardForm(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Admin Panel ⚙️</h1>
      </div>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="missions">Kelola Misi</TabsTrigger>
          <TabsTrigger value="rewards">Kelola Reward</TabsTrigger>
        </TabsList>

        {/* MISSIONS TAB */}
        <TabsContent value="missions" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Daftar Misi ({missions.length})</h2>
            <Button 
              className="bg-primary"
              onClick={() => setShowMissionForm(!showMissionForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Misi
            </Button>
          </div>

          {/* Mission Form */}
          {showMissionForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{editingMission ? 'Edit Misi' : 'Tambah Misi Baru'}</span>
                    <Button variant="ghost" size="icon" onClick={resetMissionForm}>
                      <X className="w-5 h-5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Judul Misi</Label>
                    <Input
                      value={missionForm.title}
                      onChange={(e) => setMissionForm({...missionForm, title: e.target.value})}
                      placeholder="Contoh: Buang Sampah Terpilah"
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={missionForm.description}
                      onChange={(e) => setMissionForm({...missionForm, description: e.target.value})}
                      placeholder="Jelaskan detail misi..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Poin</Label>
                      <Input
                        type="number"
                        value={missionForm.points}
                        onChange={(e) => setMissionForm({...missionForm, points: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Input
                        value={missionForm.category}
                        onChange={(e) => setMissionForm({...missionForm, category: e.target.value})}
                        placeholder="Waste Management"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Lokasi</Label>
                    <Input
                      value={missionForm.location}
                      onChange={(e) => setMissionForm({...missionForm, location: e.target.value})}
                      placeholder="Area Kampus"
                    />
                  </div>
                  
                  {qrCodeUrl && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold mb-2">QR Code Generated:</p>
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto w-48 h-48" />
                      <p className="text-sm text-gray-600 mt-2">
                        QR Code: {missionForm.qr_code}
                      </p>
                    </div>
                  )}
                  
                  <Button className="w-full bg-primary" onClick={handleSaveMission}>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Misi
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Mission List */}
          <div className="grid grid-cols-1 gap-4">
            {missions.map((mission) => (
              <Card key={mission.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold">{mission.title}</h3>
                      <p className="text-sm text-gray-600">{mission.description}</p>
                      <div className="flex gap-3 mt-2 text-sm">
                        <span className="text-primary font-semibold">+{mission.points} poin</span>
                        <span>•</span>
                        <span>{mission.category}</span>
                        <span>•</span>
                        <span>{mission.location}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        QR: {mission.qr_code}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={async () => {
                          await generateQRCode(mission.qr_code);
                        }}
                        title="Lihat QR Code"
                      >
                        <QrCodeIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setMissionForm(mission);
                          setEditingMission(mission);
                          setShowMissionForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteMission(mission.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Daftar Reward ({rewards.length})</h2>
            <Button 
              className="bg-primary"
              onClick={() => setShowRewardForm(!showRewardForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Reward
            </Button>
          </div>

          {/* Reward Form */}
          {showRewardForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{editingReward ? 'Edit Reward' : 'Tambah Reward Baru'}</span>
                    <Button variant="ghost" size="icon" onClick={resetRewardForm}>
                      <X className="w-5 h-5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nama Reward</Label>
                    <Input
                      value={rewardForm.name}
                      onChange={(e) => setRewardForm({...rewardForm, name: e.target.value})}
                      placeholder="Contoh: Diskon Kantin 20%"
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={rewardForm.description}
                      onChange={(e) => setRewardForm({...rewardForm, description: e.target.value})}
                      placeholder="Jelaskan detail reward..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Poin Dibutuhkan</Label>
                      <Input
                        type="number"
                        value={rewardForm.points}
                        onChange={(e) => setRewardForm({...rewardForm, points: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>Stok</Label>
                      <Input
                        type="number"
                        value={rewardForm.stock}
                        onChange={(e) => setRewardForm({...rewardForm, stock: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kategori</Label>
                      <Input
                        value={rewardForm.category}
                        onChange={(e) => setRewardForm({...rewardForm, category: e.target.value})}
                        placeholder="Diskon, Merchandise, dll"
                      />
                    </div>
                    <div>
                      <Label>Emoji</Label>
                      <Input
                        value={rewardForm.image_emoji}
                        onChange={(e) => setRewardForm({...rewardForm, image_emoji: e.target.value})}
                        placeholder="🎁"
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-primary" onClick={handleSaveReward}>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Reward
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reward List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className="text-3xl">{reward.image_emoji}</div>
                      <div>
                        <h3 className="font-bold">{reward.name}</h3>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                        <div className="flex gap-2 mt-2 text-sm">
                          <span className="font-semibold text-primary">{reward.points} poin</span>
                          <span>•</span>
                          <span>Stok: {reward.stock}</span>
                          <span>•</span>
                          <span>{reward.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setRewardForm(reward);
                          setEditingReward(reward);
                          setShowRewardForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteReward(reward.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* QR Code Display Modal */}
      {qrCodeUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setQrCodeUrl('')}
        >
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                QR Code
                <Button variant="ghost" size="icon" onClick={() => setQrCodeUrl('')}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto w-64 h-64" />
              <p className="text-sm text-gray-600 mt-4">
                Scan QR code ini di lokasi misi
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'qr-code.png';
                  link.href = qrCodeUrl;
                  link.click();
                }}
              >
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;
