import { Outlet, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { init } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
