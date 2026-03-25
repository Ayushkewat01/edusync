import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Clock, CheckCircle, AlertCircle, FileText, Send, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { getDeadlineStatus, formatDate } from '../../lib/utils';

export default function AssignmentListPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) loadAssignments();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
    } catch {}
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/assignments/${selectedClass}`);
      setAssignments(data);
    } catch {}
    setLoading(false);
  };

  const statusBadge = (assignment) => {
    if (assignment.isOverdue) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Overdue</span>;
    }
    const dl = getDeadlineStatus(assignment.deadline);
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
      dl.urgent ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
    }`}>{dl.text}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-dark">Assignments</h1>
          <p className="text-text-muted">Manage and track all assignments</p>
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
              <Plus className="w-4 h-4" /> New Assignment
            </button>
          )}
        </div>
      </div>

      {/* Assignment Grid */}
      {assignments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold dark:text-text-dark">No assignments yet</h3>
          <p className="text-text-muted mt-2">
            {user?.role === 'teacher' ? 'Create your first assignment to get started.' : 'Your teacher hasn\'t created any assignments yet.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment, i) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                {statusBadge(assignment)}
              </div>
              <h3 className="font-semibold dark:text-text-dark line-clamp-2">{assignment.title}</h3>
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{assignment.description || 'No description'}</p>
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(assignment.deadline)}
                </span>
                {user?.role === 'teacher' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {assignment.submissionCount || 0} submitted
                  </span>
                ) : (
                  <button
                    onClick={() => setShowSubmit(assignment)}
                    className="text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && <CreateAssignmentModal classId={selectedClass} onClose={() => { setShowCreate(false); loadAssignments(); }} />}

      {/* Submit Modal */}
      {showSubmit && <SubmitModal assignment={showSubmit} onClose={() => { setShowSubmit(null); loadAssignments(); }} />}
    </div>
  );
}

function CreateAssignmentModal({ classId, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', deadline: '', maxScore: 100 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/assignments', { ...form, classId });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-text-dark">New Assignment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Title</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark"
              placeholder="e.g., Data Structures Assignment 3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 resize-none dark:text-text-dark"
              placeholder="Assignment instructions..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Deadline</label>
              <input
                type="datetime-local" required value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Max Score</label>
              <input
                type="number" value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 dark:text-text-dark"
              />
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function SubmitModal({ assignment, onClose }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/assignments/${assignment._id}/submit`, { textContent: text });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-text-dark">Submit: {assignment.title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-text-muted mb-4">{assignment.description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-text-dark">Your Answer</label>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              rows={5} required
              className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 resize-none dark:text-text-dark"
              placeholder="Write your answer or paste content..."
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
