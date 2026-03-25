import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, X, AlertCircle, Info, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import { timeAgo, getInitials } from '../../lib/utils';

const priorityConfig = {
  normal: { icon: Info, bg: 'bg-primary/10', text: 'text-primary', label: 'Normal', dot: 'bg-primary' },
  important: { icon: AlertCircle, bg: 'bg-warning/10', text: 'text-warning', label: 'Important', dot: 'bg-warning' },
  urgent: { icon: Zap, bg: 'bg-destructive/10', text: 'text-destructive', label: 'Urgent', dot: 'bg-destructive' },
};

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const { socket, joinClass, leaveClass } = useSocket();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      joinClass(selectedClass);
      loadAnnouncements();
      return () => leaveClass(selectedClass);
    }
  }, [selectedClass, joinClass, leaveClass]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (data) => {
      if (data.announcement) {
        setAnnouncements(prev => [data.announcement, ...prev]);
      }
    };
    socket.on('new-announcement', handleNew);
    return () => socket.off('new-announcement', handleNew);
  }, [socket]);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
    } catch {}
  };

  const loadAnnouncements = async () => {
    try {
      const { data } = await api.get(`/announcements/${selectedClass}`);
      setAnnouncements(data);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-dark">Announcements</h1>
          <p className="text-text-muted">Class announcements and updates</p>
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
          {user?.role === 'teacher' && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Announcement Feed */}
      {announcements.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
          <Megaphone className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold dark:text-text-dark">No announcements</h3>
          <p className="text-text-muted mt-2">
            {user?.role === 'teacher' ? 'Post your first announcement.' : 'No announcements from your teacher yet.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement, i) => {
            const prio = priorityConfig[announcement.priority] || priorityConfig.normal;
            const PrioIcon = prio.icon;
            return (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {announcement.teacherId?.name ? getInitials(announcement.teacherId.name) : 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm dark:text-text-dark">{announcement.teacherId?.name || 'Teacher'}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{timeAgo(announcement.createdAt)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${prio.bg} ${prio.text}`}>
                        <PrioIcon className="w-3 h-3" />
                        {prio.label}
                      </span>
                    </div>
                    <h3 className="font-semibold dark:text-text-dark">{announcement.title}</h3>
                    <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{announcement.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateAnnouncementModal
          classId={selectedClass}
          onClose={() => { setShowCreate(false); loadAnnouncements(); }}
        />
      )}
    </div>
  );
}

function CreateAnnouncementModal({ classId, onClose }) {
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/announcements', { ...form, classId });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-text-dark">New Announcement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Title</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark"
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Message</label>
            <textarea
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4} required
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 resize-none dark:text-text-dark"
              placeholder="Write your announcement..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <button
                  key={key} type="button"
                  onClick={() => setForm({ ...form, priority: key })}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.priority === key
                      ? `border-current ${config.bg} ${config.text}`
                      : 'border-border dark:border-border-dark text-text-muted'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
