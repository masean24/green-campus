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
    if (scanning) {
      const timer = setTimeout(() => {
        const qrDiv = document.getElementById('qr-reader');
        if (qrDiv && selectedCamera) {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;
          html5QrCode
            .start(
              selectedCamera,
              { fps: 10, qrbox: { width: 250, height: 250 } },
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

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const curIdx = cameras.findIndex(c => c.id === selectedCamera);
    const nextIdx = (curIdx + 1) % cameras.length;
    const nextCam = cameras[nextIdx];
    stopScanning();
    setTimeout(() => setSelectedCamera(nextCam.id), 100);
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
              <div className
