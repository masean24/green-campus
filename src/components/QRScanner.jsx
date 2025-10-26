import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Sparkles, SwitchCamera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Ambil daftar kamera saat komponen mount
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer kamera belakang
        const backCamera = devices.find(
          d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
      }
    }).catch(err => {
      console.error('Error getting cameras:', err);
      setError('Tidak dapat mengakses kamera. Pastikan browser memiliki izin.');
    });

    // Clean up
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  // start scanner di useEffect setelah <div id="qr-reader" /> render
  useEffect(() => {
    if (scanning && selectedCamera) {
      const timer = setTimeout(() => {
        const qrDiv = document.getElementById('qr-reader');
        if (qrDiv) {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;
          html5QrCode.start(
            { deviceId: { exact: selectedCamera } },
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              videoConstraints: {
                width: { ideal: 1280 }, 
                height: { ideal: 720 }
              }
            },
            onScanSuccess,
            onScanError
          )
            .catch(err => {
              setError('Gagal membuka kamera.');
              setScanning(false);
            });
        }
      }, 200);

      return () => clearTimeout(timer);
    }

    // Jangan lupa stop scanner kalau scanning berubah/jadi false
    if (!scanning && scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, [scanning, selectedCamera]);

  const onScanSuccess = async decodedText => {
    // stop scanner segera
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
    validateAndProcessQR(decodedText);
  };

  const onScanError = error => {
    // optional: tampilkan/log error scan (biasanya no problem)
  };

  const validateAndProcessQR = async qrCode => {
    setProcessing(true);
    setError(null);

    try {
      // Validasi QR code
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('active', true)
        .single();

      if (missionError || !missionData) {
        throw new Error('QR Code tidak valid atau misi tidak aktif ❌');
      }

      // Cek sudah pernah kerjakan misi?
      const { data: existingMission } = await supabase
        .from('user_missions')
        .select('id')
        .eq('user_id', profile.id)
        .eq('mission_id', missionData.id)
        .single();

      if (existingMission) {
        throw new Error('Misi ini sudah pernah kamu selesaikan! 🔁');
      }

      // Beri poin (insert ke user_missions)
      const { error: insertError } = await supabase
        .from('user_missions')
        .insert({
          user_id: profile.id,
          mission_id: missionData.id,
          points_earned: missionData.points,
          qr_scanned: qrCode
        });

      if (insertError) throw insertError;

      // Update points profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: profile.points + missionData.points,
          completed_missions: profile.completed_missions + 1
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Success!
      setResult({
        success: true,
        mission: missionData,
        points: missionData.points
      });
      refreshProfile();
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat validasi QR Code');
      setResult({ success: false });
    } finally {
      setProcessing(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // -- Fitur Pilih Kamera (Depan/Belakang/semua yang tersedia)
  const handleSelectCamera = (e) => {
    stopScanning();
    setSelectedCamera(e.target.value);
    setTimeout(() => setScanning(true), 200);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <AnimatePresence mode="wait">
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <Card className="w-64">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-semibold">Memvalidasi QR Code...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center justify-center md:justify-start gap-2">
          <Camera className="w-8 h-8" />
          Scan QR Code
        </h1>
        <p className="text-gray-600 mt-2">
          Arahkan kamera ke QR code di lokasi misi
        </p>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-white">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Camera className="w-6 h-6" />
              {scanning
                ? 'Sedang Memindai...'
                : result
                ? result.success
                  ? '🎉 Berhasil!'
                  : '❌ Gagal'
                : 'Siap Memindai'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Scanner View */}
            {!result && !scanning && (
              <div className="text-center space-y-4">
                <motion.div
                  className="w-40 h-40 bg-gradient-to-br from-primary/10 to-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Camera className="w-20 h-20 text-primary" />
                </motion.div>

                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    📱 Pastikan QR code terlihat jelas
                  </p>
                  <p className="text-sm text-gray-500">
                    Browser akan meminta izin akses kamera
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setScanning(true);
                    setError(null);
                  }}
                  className="w-full bg-primary hover:bg-primary-dark h-14 text-lg font-semibold"
                  size="lg"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Mulai Scan
                </Button>

                {/* Select Kamera (Jika Ada Lebih dari 1) */}
                {cameras.length > 1 && (
                  <div className="mt-4">
                    <label className="block mb-1 font-semibold text-primary">
                      Pilih Kamera:
                    </label>
                    <select
                      value={selectedCamera}
                      onChange={handleSelectCamera}
                      className="border rounded-lg px-4 py-2 w-full"
                    >
                      {cameras.map(cam => (
                        <option value={cam.id} key={cam.id}>
                          {cam.label || 'Kamera'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3 mt-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Active Scanning */}
            {scanning && (
              <div className="space-y-4">
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-blue-700 mb-1">
                    📷 Arahkan ke QR Code
                  </p>
                  <p className="text-xs text-blue-600">Scanner akan otomatis mendeteksi QR code</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
                {/* Select Kamera Aktif */}
                {cameras.length > 1 && (
                  <div>
                    <label className="block mb-1 text-primary font-semibold">
                      Ganti Kamera:
                    </label>
                    <select
                      value={selectedCamera}
                      onChange={handleSelectCamera}
                      className="border rounded-lg px-4 py-2 w-full"
                    >
                      {cameras.map(cam => (
                        <option value={cam.id} key={cam.id}>
                          {cam.label || 'Kamera'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Result View */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                {result.success ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200
                      }}
                    >
                      <CheckCircle className="w-28 h-28 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
                      <h3 className="font-bold text-xl mb-3">{result.mission.title}</h3>
                      <div className="flex items-center justify-center gap-2 text-green-700 text-3xl font-bold mb-2">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                        +{result.points} poin
                        <Sparkles className="w-8 h-8 animate-pulse" />
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        🎉 Selamat! Misi berhasil diselesaikan
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 animate-pulse">
                      Mengalihkan ke dashboard...
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-28 h-28 text-red-500 mx-auto mb-4" />
                    <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
                      <p className="font-semibold text-red-700 mb-2 text-lg">Validasi Gagal</p>
                      <p className="text-sm text-gray-600">{error}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setResult(null);
                        setError(null);
                      }}
                      className="w-full bg-primary hover:bg-primary-dark"
                    >
                      Scan Lagi
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Instructions */}
      {!scanning && !result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                💡 Tips Scan QR Code
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Pastikan QR code terlihat jelas</li>
                <li>✓ Cukup cahaya di sekitar QR code</li>
                <li>✓ Jaga jarak 15-30 cm dari kamera</li>
                <li>✓ QR code tidak tertutup atau rusak</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default QRScanner;
