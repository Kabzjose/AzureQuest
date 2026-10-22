import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, RefreshCw, LogOut, User, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { auth as authApi } from '../../lib/api';

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
        }`
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* best effort */ }
    clearAuth();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-brand-400 font-bold text-lg">
            <Zap className="h-5 w-5" aria-hidden="true" />
            AzureQuest
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <NavItem to="/" icon={Zap} label="Home" />
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/scenarios" icon={BookOpen} label="Scenarios" />
            <NavItem to="/revise" icon={RefreshCw} label="Revise" />
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              {user?.isGuest ? 'Guest mode' : user?.email ?? 'Account'}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-2 flex gap-2 overflow-x-auto" aria-label="Mobile navigation">
        <NavItem to="/" icon={Zap} label="Home" />
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/scenarios" icon={BookOpen} label="Scenarios" />
        <NavItem to="/revise" icon={RefreshCw} label="Revise" />
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-600">
        Unofficial study tool. Not affiliated with or endorsed by Microsoft. ·{' '}
        <Link to="/about" className="hover:text-gray-400 underline">About</Link>
      </footer>
    </div>
  );
}
