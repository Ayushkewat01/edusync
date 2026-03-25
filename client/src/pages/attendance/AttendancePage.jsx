import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Camera, Download, RefreshCw, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function AttendancePage() {
  const { user } = useAuthStore();
  return user?.role === 'teacher' ? <TeacherAttendance /> : <StudentAttendance />;
}

function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [records, setRecords] = useState([]);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
    } catch {}
  };

  const loadRecords = async () => {
    if (!selectedClass) return;
    try {
      const { data } = await api.get(`/attendance/${selectedClass}`);
      setRecords(data);
    } catch {}
  };

  useEffect(() => {
    loadRecords();
  }, [selectedClass]);

  const generateQR = async () => {
    if (!selectedClass) return;
    try {
      const { data } = await api.post('/attendance/generate-qr', { classId: selectedClass });
      setQrData(data.sessionToken);
      setCountdown(60);
      setShowQR(true);
      setScanCount(0);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate QR');
    }
  };

  const exportCSV = () => {
    let csv = 'Date,Student,Status,Time\n';
    records.forEach(r => {
      r.records?.forEach(rec => {
        csv += `${new Date(r.date).toLocaleDateString()},${rec.studentId?.name || 'Unknown'},${rec.status},${new Date(rec.markedAt).toLocaleTimeString()}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-dark">Attendance</h1>
          <p className="text-text-muted">Generate QR codes and track attendance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none dark:text-text-dark"
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="px-4 py-2.5 text-sm font-medium bg-muted dark:bg-muted-dark rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 dark:text-text-dark">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* QR Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col items-center text-center"
        >
          {showQR && qrData ? (
            <>
              <div className={`p-6 bg-white rounded-2xl shadow-lg ${countdown > 0 ? 'qr-pulse' : 'opacity-30'}`}>
                <QRCodeSVG value={qrData} size={220} level="H" includeMargin />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className={`text-2xl font-bold ${countdown > 10 ? 'text-success' : countdown > 0 ? 'text-warning' : 'text-destructive'}`}>
                  {countdown > 0 ? `${countdown}s` : 'Expired'}
                </div>
                {countdown > 0 && (
                  <div className="px-4 py-2 mt-1 bg-muted dark:bg-muted-dark rounded-lg border border-border dark:border-border-dark flex items-center gap-3 shadow-inner">
                    <span className="text-sm font-semibold text-text-muted">Token:</span>
                    <span className="font-mono text-xl tracking-[0.2em] font-extrabold text-primary dark:text-primary-light uppercase">{qrData}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <Users className="w-4 h-4" />
                {scanCount} students scanned
              </div>
              <button 
                onClick={generateQR}
                className="mt-4 px-6 py-2.5 gradient-primary text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" /> New QR Code
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold dark:text-text-dark">Generate Attendance QR</h3>
              <p className="text-sm text-text-muted mt-2 mb-4">Students will scan this code to mark their attendance. Code expires in 60 seconds.</p>
              <button
                onClick={generateQR}
                disabled={!selectedClass}
                className="px-6 py-3 gradient-primary text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" /> Generate QR Code
              </button>
            </>
          )}
        </motion.div>

        {/* Anti-proxy warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 dark:text-text-dark flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Anti-Proxy Detection
          </h3>
          <p className="text-sm text-text-muted mb-4">
            The system monitors device fingerprints and IP addresses to detect proxy attendance attempts.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm dark:text-text-dark">Unique device verification</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm dark:text-text-dark">Time-limited QR codes (60s)</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm dark:text-text-dark">Duplicate IP detection</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 dark:text-text-dark">Attendance Records</h3>
        {records.length === 0 ? (
          <p className="text-text-muted text-center py-8">No attendance records yet. Generate a QR code to start tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark">
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Students Present</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Rate</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 10).map((r) => (
                  <tr key={r._id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-muted/50 dark:hover:bg-muted-dark/50">
                    <td className="py-3 px-4 dark:text-text-dark">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 dark:text-text-dark">{r.records?.length || 0}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        {r.records?.length || 0} present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StudentAttendance() {
  const [scanning, setScanning] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState(null);

  const markAttendance = async (token) => {
    try {
      const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;
      const { data } = await api.post('/attendance/mark', {
        sessionToken: token,
        deviceFingerprint: fingerprint,
      });
      setResult({ success: true, message: data.message, warning: data.warning });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to mark attendance' });
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-dark">Attendance</h1>
        <p className="text-text-muted">Scan QR code or enter session token to mark attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner / Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mb-4">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold dark:text-text-dark">Mark Attendance</h3>
          <p className="text-sm text-text-muted mt-2 mb-6">Enter the session token shown below the QR code</p>
          
          <div className="w-full max-w-sm space-y-3">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter session token..."
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 text-center font-mono dark:text-text-dark"
            />
            <button
              onClick={() => markAttendance(tokenInput)}
              disabled={!tokenInput}
              className="w-full py-3 gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              Mark Present
            </button>
          </div>
        </motion.div>

        {/* Result */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 flex flex-col items-center justify-center text-center">
          {result ? (
            <>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${result.success ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {result.success ? (
                  <CheckCircle className="w-10 h-10 text-success" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                )}
              </div>
              <h3 className={`text-lg font-semibold ${result.success ? 'text-success' : 'text-destructive'}`}>
                {result.success ? 'Attendance Marked!' : 'Failed'}
              </h3>
              <p className="text-sm text-text-muted mt-2">{result.message}</p>
              {result.warning && (
                <div className="mt-3 p-3 bg-warning/10 rounded-xl text-warning text-sm">
                  {result.warning}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-muted dark:bg-muted-dark flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold dark:text-text-dark">Waiting...</h3>
              <p className="text-sm text-text-muted mt-2">Enter the session token to mark your attendance</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
