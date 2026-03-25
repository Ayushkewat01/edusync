import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, BookOpen, CheckCircle, Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${color}`} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-3xl font-extrabold dark:text-text-dark tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-text-muted mt-1">{label}</p>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    attendancePercentage: 0,
    assignmentsDue: 0,
    completed: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [attendanceData, setAttendanceData] = useState([
    { name: 'Present', value: 0 },
    { name: 'Absent', value: 100 }
  ]);

  const [weeklyScores, setWeeklyScores] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [assignmentsRes, attendanceRes] = await Promise.all([
         api.get('/assignments'),
         api.get('/attendance/my-stats')
      ]);
      const data = assignmentsRes.data;
      const attData = attendanceRes.data;

      const pending = data.filter(a => new Date(a.dueDate) > new Date() && !a.submissions?.some(s => s.studentId === user._id));
      const sorted = pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
      
      setUpcomingDeadlines(sorted);
      
      if (attData.attendanceData) setAttendanceData(attData.attendanceData);
      if (attData.weeklyScores) setWeeklyScores(attData.weeklyScores);

      setStats(prev => ({
        ...prev,
        assignmentsDue: pending.length,
        attendancePercentage: attData.attendancePercentage || 0,
        completed: data.length - pending.length
      }));
    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="gradient-primary rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute right-10 bottom-10 w-32 h-32 bg-secondary/30 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/80 font-medium mb-3">
              <Calendar className="w-4 h-4" />
              <span>{todayStr}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
              Good morning, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/90 text-lg leading-relaxed max-w-lg font-medium">
              You have {stats.assignmentsDue} impending assignments. 
              Stay focused and keep up the momentum!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={ClipboardCheck} label="Overall Attendance" value={`${stats.attendancePercentage}%`} color="gradient-accent" delay={1} />
        <StatCard icon={Clock} label="Assignments Due" value={stats.assignmentsDue} color="gradient-warning" delay={2} />
        <StatCard icon={CheckCircle} label="Completed Tasks" value={stats.completed} color="gradient-success" delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-text-dark flex items-center gap-2">
              <Clock className="w-6 h-6 text-warning" />
              Action Items
            </h2>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted dark:bg-muted-dark rounded-2xl" />)}
            </div>
          ) : upcomingDeadlines.length > 0 ? (
            <div className="space-y-4">
              {upcomingDeadlines.map((item, idx) => {
                const deadline = new Date(item.dueDate);
                const hoursLeft = Math.floor((deadline - new Date()) / (1000 * 60 * 60));
                const daysLeft = Math.floor(hoursLeft / 24);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                    key={item._id} 
                    className="flex items-center justify-between p-5 rounded-2xl border border-border/50 dark:border-border-dark/50 bg-white/50 dark:bg-surface-dark/50 hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${daysLeft < 2 ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
                      <div>
                        <h3 className="font-semibold text-base dark:text-text-dark">{item.title}</h3>
                        <p className="text-sm font-medium text-text-muted mt-1">{item.classId?.name || 'Class Assignment'}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                        hoursLeft < 24
                          ? 'bg-destructive/15 text-destructive border border-destructive/20'
                          : daysLeft < 3
                            ? 'bg-warning/15 text-warning border border-warning/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {daysLeft > 0 ? `${daysLeft} days remaining` : `${hoursLeft} hours left`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border dark:border-border-dark bg-muted/20 dark:bg-muted-dark/20">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-bold dark:text-text-dark mb-1">All caught up!</h3>
                <p className="text-text-muted font-medium">You have no pending assignments at the moment.</p>
             </div>
          )}
        </motion.div>

        {/* Charts Column */}
        <div className="space-y-8">
          {/* Attendance Donut */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-7"
          >
            <h2 className="text-lg font-bold mb-6 dark:text-text-dark">Attendance Overview</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3}
                  dataKey="value" stroke="none"
                >
                  {attendanceData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 mt-4">
              {attendanceData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md shadow-sm" style={{ background: COLORS[i] }} />
                  <span className="text-sm font-semibold text-text-muted">{entry.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Score chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-7"
          >
            <h2 className="text-lg font-bold mb-6 dark:text-text-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Trend
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyScores} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="score" fill="url(#colorScore)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {weeklyScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10B981' : entry.score > 80 ? '#6366F1' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
