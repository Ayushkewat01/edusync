import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import { useState } from 'react';

export default function Navbar({ onMenuToggle }) {
  const { isDark, toggle } = useThemeStore();
  const { user } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/10 dark:border-white/5">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Mobile menu + Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-muted dark:hover:bg-muted-dark transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-muted dark:bg-muted-dark rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all dark:text-text-dark"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-muted dark:hover:bg-muted-dark transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-warning" />
            ) : (
              <Moon className="w-5 h-5 text-text-muted" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2.5 rounded-xl hover:bg-muted dark:hover:bg-muted-dark transition-colors relative"
            >
              <Bell className="w-5 h-5 text-text-muted dark:text-text-dark" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-72 glass-card p-4 shadow-xl">
                <h3 className="text-sm font-semibold mb-3 dark:text-text-dark">Notifications</h3>
                <div className="space-y-2">
                  <p className="text-xs text-text-muted py-4 text-center">No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* User greeting */}
          <div className="hidden md:block pl-2 border-l border-border dark:border-border-dark ml-2">
            <p className="text-sm font-medium pl-4 dark:text-text-dark">
              Hi, {user?.name?.split(' ')[0]} 👋
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
