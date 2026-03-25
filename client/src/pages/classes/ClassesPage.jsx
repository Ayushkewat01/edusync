import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, Copy, Check, X, Hash } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => { loadClasses(); }, []);
  const loadClasses = async () => { try { const { data } = await api.get('/classes'); setClasses(data); } catch {} };
  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(''), 2000); };
  const colors = ['gradient-primary', 'gradient-accent', 'gradient-success', 'gradient-warning'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-dark">My Classes</h1>
          <p className="text-text-muted">{user?.role === 'teacher' ? 'Create and manage your classes' : 'View and join classes'}</p>
        </div>
        <button onClick={() => user?.role === 'teacher' ? setShowCreate(true) : setShowJoin(true)} className="px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> {user?.role === 'teacher' ? 'Create Class' : 'Join Class'}
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold dark:text-text-dark">No classes yet</h3>
          <p className="text-text-muted mt-2">{user?.role === 'teacher' ? 'Create your first class.' : 'Join a class using a code.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls, i) => (
            <motion.div key={cls._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <div className={`${colors[i % colors.length]} p-5 text-white`}>
                <div className="flex items-center gap-2 text-white/80 text-sm mb-2"><BookOpen className="w-4 h-4" />{cls.subject}</div>
                <h3 className="text-lg font-bold">{cls.name}</h3>
              </div>
              <div className="p-5">
                <span className="text-sm text-text-muted flex items-center gap-1 mb-3"><Users className="w-4 h-4" />{cls.studentIds?.length || 0} students</span>
                {user?.role === 'teacher' && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 dark:bg-muted-dark/50 rounded-xl">
                    <Hash className="w-4 h-4 text-text-muted" />
                    <span className="font-mono text-sm font-semibold dark:text-text-dark tracking-widest">{cls.joinCode}</span>
                    <button onClick={() => copyCode(cls.joinCode)} className="ml-auto p-1.5 rounded-lg hover:bg-muted dark:hover:bg-muted-dark">
                      {copiedCode === cls.joinCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-muted" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && <Modal title="Create Class" onClose={() => { setShowCreate(false); loadClasses(); }}>
        {(close) => <CreateForm onDone={close} />}
      </Modal>}
      {showJoin && <Modal title="Join Class" onClose={() => { setShowJoin(false); loadClasses(); }}>
        {(close) => <JoinForm onDone={close} />}
      </Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-text-dark">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"><X className="w-5 h-5" /></button>
        </div>
        {children(onClose)}
      </motion.div>
    </div>
  );
}

function CreateForm({ onDone }) {
  const [form, setForm] = useState({ name: '', subject: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/classes', form); onDone(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Class Name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark" placeholder="e.g., CS201" /></div>
      <div><label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Subject</label>
        <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark" placeholder="e.g., Computer Science" /></div>
      <button type="submit" disabled={loading} className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg disabled:opacity-60">{loading ? 'Creating...' : 'Create Class'}</button>
    </form>
  );
}

function JoinForm({ onDone }) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/classes/join', { joinCode }); onDone(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Join Code</label>
        <input type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="w-full px-4 py-4 bg-muted dark:bg-muted-dark rounded-xl text-lg border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 text-center font-mono tracking-[0.5em] uppercase dark:text-text-dark" placeholder="ABC123" /></div>
      <button type="submit" disabled={loading} className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg disabled:opacity-60">{loading ? 'Joining...' : 'Join Class'}</button>
    </form>
  );
}
