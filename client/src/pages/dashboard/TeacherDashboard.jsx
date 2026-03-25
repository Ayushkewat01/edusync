import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ClipboardCheck, BookOpen, FileText, Plus, QrCode, Megaphone, TrendingUp, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const mockWeeklyData = [
  { day: 'Mon', attendance: 85 },
  { day: 'Tue', attendance: 92 },
  { day: 'Wed', attendance: 78 },
  { day: 'Thu', attendance: 95 },
  { day: 'Fri', attendance: 88 },
];

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${color}`} />
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs font-bold">
          <TrendingUp className="w-3 h-3" />
          <span>+2.4%</span>
        </div>
      </div>
      <h3 className="text-3xl font-extrabold dark:text-text-dark tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-text-muted mt-1">{label}</p>
    </motion.div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 92,
    pendingAssignments: 0,
    newSubmissions: 0,
  });
  const [classes, setClasses] = useState([]);
  const [weeklyData, setWeeklyData] = useState(mockWeeklyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, assignmentsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/assignments')
      ]);
      
      const classesData = classesRes.data;
      const assignmentsData = assignmentsRes.data;
      
      setClasses(classesData);
      
      const totalStudents = classesData.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0);
      
      // Calculate active assignments (deadline in future)
      const activeAssignments = assignmentsData.filter(a => new Date(a.deadline || a.dueDate) > new Date()).length;
      
      // Calculate total submissions across all assignments
      const totalSubmissions = assignmentsData.reduce((sum, a) => sum + (a.submissionCount || 0), 0);
      
      setStats(prev => ({ 
        ...prev, 
        totalStudents,
        pendingAssignments: activeAssignments,
        newSubmissions: totalSubmissions
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: QrCode, label: 'Record Attendance', desc: 'Scan QR', color: 'gradient-primary', onClick: () => navigate('/attendance') },
    { icon: Plus, label: 'Create Assignment', desc: 'Set deadline', color: 'gradient-accent', onClick: () => navigate('/assignments') },
    { icon: Megaphone, label: 'Broadcast Message', desc: 'Announcement', color: 'gradient-success', onClick: () => navigate('/announcements') },
  ];

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 text-text-muted font-medium mb-1.5">
            <Calendar className="w-4 h-4" />
            <span>{todayStr}</span>
          </div>
          <h1 className="text-3xl font-extrabold dark:text-text-dark tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-text-muted mt-1 text-lg">Here's the overview of your classes today.</p>
        </div>
        
        {/* Quick Actions Desktop */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex gap-3"
        >
          {quickActions.map(({ icon: Icon, label, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`${color} text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-${color}/20 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Quick Actions Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:hidden">
        {quickActions.map(({ icon: Icon, label, desc, color, onClick }) => (
          <button
            key={label} onClick={onClick}
            className={`flex items-center p-4 rounded-xl text-white ${color} shadow-lg text-left`}
          >
            <Icon className="w-6 h-6 mr-3 opacity-90" />
            <div>
              <div className="font-bold text-sm tracking-wide">{label}</div>
              <div className="text-xs opacity-75 font-medium">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="gradient-primary" delay={0} />
        <StatCard icon={ClipboardCheck} label="Today's Attendance" value={`${stats.todayAttendance}%`} color="gradient-accent" delay={1} />
        <StatCard icon={BookOpen} label="Active Assignments" value={stats.pendingAssignments} color="gradient-warning" delay={2} />
        <StatCard icon={FileText} label="New Submissions" value={stats.newSubmissions} color="gradient-success" delay={3} />
      </div>

      {/* Charts and Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-7"
        >
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold dark:text-text-dark">Weekly Attendance Trend</h2>
             <select className="bg-muted dark:bg-muted-dark border-none outline-none text-sm font-semibold text-text-muted px-3 py-1.5 rounded-lg cursor-pointer">
               <option>This Week</option>
               <option>Last Week</option>
             </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748B', fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748B', fontWeight: 500 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
              />
              <Area type="monotone" dataKey="attendance" stroke="#6366F1" strokeWidth={3} fill="url(#attendanceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* At Risk Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-7 flex flex-col"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold dark:text-text-dark flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Needs Attention
            </h2>
            <span className="text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">3 Students</span>
          </div>
          <div className="space-y-4 flex-1">
            <p className="text-sm text-text-muted mb-2 font-medium">Students with attendance below 75%</p>
            {[
              { name: 'Rahul Kumar', attendance: 62, trend: 'down' },
              { name: 'Priya Sharma', attendance: 68, trend: 'down' },
              { name: 'Amit Patel', attendance: 71, trend: 'up' },
            ].map((student) => (
              <div key={student.name} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 dark:border-border-dark/50 bg-white/50 dark:bg-surface-dark/50 hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-warning flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="text-sm font-bold dark:text-text-dark block">{student.name}</span>
                    <span className="text-xs text-text-muted font-medium">Last seen 3 days ago</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">{student.attendance}%</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-border dark:border-border-dark text-text-muted font-semibold hover:bg-muted dark:hover:bg-muted-dark hover:text-text dark:hover:text-text-dark transition-colors text-sm flex items-center justify-center gap-1">
            View All Reports <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Classes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-5">
           <h2 className="text-xl font-bold dark:text-text-dark">Active Classes</h2>
           <button onClick={() => navigate('/classes')} className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">See all</button>
        </div>
        
        {loading ? (
             <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-muted dark:bg-muted-dark rounded-2xl" />)}
             </div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <div key={cls._id} className="glass-card p-6 border-t-4 border-t-primary cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 opacity-5 w-32 h-32 bg-primary rounded-full transition-transform group-hover:scale-150" />
                <h3 className="font-extrabold text-lg dark:text-text-dark tracking-tight">{cls.name}</h3>
                <p className="text-sm text-text-muted font-medium mb-4">{cls.subject}</p>
                <div className="flex items-center justify-between border-t border-border/50 dark:border-border-dark/50 pt-4">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">{cls.studentIds?.length || 0}</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                    CODE: {cls.joinCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-10 text-center border-dashed">
             <div className="w-16 h-16 bg-muted dark:bg-muted-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-text-muted" />
             </div>
             <h3 className="text-lg font-bold dark:text-text-dark mb-2">No classes yet</h3>
             <p className="text-text-muted mb-4 max-w-sm mx-auto">Create your first class to start tracking attendance, distributing assignments, and more.</p>
             <button onClick={() => navigate('/classes')} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-medium transition-colors">
               Create Class
             </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
