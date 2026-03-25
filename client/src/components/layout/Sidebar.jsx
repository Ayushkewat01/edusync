import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen,
  MessageSquare, Sparkles, LogOut, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import { useState } from 'react';

const teacherLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: Users, label: 'Classes' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/assignments', icon: BookOpen, label: 'Assignments' },
  { to: '/announcements', icon: MessageSquare, label: 'Announcements' },
  { to: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
];

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: Users, label: 'My Classes' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/assignments', icon: BookOpen, label: 'Assignments' },
  { to: '/announcements', icon: MessageSquare, label: 'Announcements' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full glass border-r border-white/10 dark:border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              EduSync
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'gradient-primary text-white shadow-lg shadow-primary/25'
                    : 'text-text-muted hover:bg-muted dark:hover:bg-muted-dark hover:text-text dark:hover:text-text-dark'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-3 mb-2 p-2 rounded-xl text-text-muted hover:bg-muted dark:hover:bg-muted-dark transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User section */}
        <div className="border-t border-white/10 dark:border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user ? getInitials(user.name) : '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate dark:text-text-dark">{user?.name}</p>
                <p className="text-xs text-text-muted capitalize">{user?.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
