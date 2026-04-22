import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Upload,
  History,
  Settings,
  LogOut,
  Bell,
  User,
  Shield,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import VoiceAssistant from './VoiceAssistant';
import OfflineIndicator from './OfflineIndicator';
import NotificationCenter from './NotificationCenter';
import { useApp } from '../context/AppContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Upload, label: 'Upload', path: '/app/upload' },
  { icon: History, label: 'History', path: '/app/history' },
  { icon: Shield, label: 'Admin', path: '/app/admin', adminOnly: true },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === 'Admin' || user?.role === 'Veterinarian';
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside
        className={`w-72 bg-white dark:bg-gray-900 border-r border-[var(--border)] flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-xl">🐄</span>
            </div>
            <div>
              <h1 className="text-lg text-[var(--foreground)]">Livestock AI</h1>
              <p className="text-xs text-[var(--muted-foreground)]">Smart Recognition</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--muted)]">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl">
              {user?.avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--foreground)] truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{user?.role || 'Farmer'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Top Navbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-[var(--border)] px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-[var(--muted)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg lg:text-xl text-[var(--foreground)]">
                  Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                </h2>
                <p className="text-xs lg:text-sm text-[var(--muted-foreground)] hidden sm:block">
                  Let's analyze your livestock today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      <VoiceAssistant />
      <OfflineIndicator />
    </div>
  );
}