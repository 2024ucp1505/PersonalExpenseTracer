import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',             icon: '📊', label: 'Dashboard'    },
  { to: '/transactions', icon: '💸', label: 'Transactions'  },
  { to: '/accounts',     icon: '🏦', label: 'Accounts'      },
  { to: '/budgets',      icon: '📋', label: 'Budgets'       },
  { to: '/categories',   icon: '🏷️', label: 'Categories'   },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 z-40
                        bg-[#0a0a1a]/95 backdrop-blur-xl border-r border-white/5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center text-lg shadow-lg shadow-indigo-900/40">
            💰
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FinTrack</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center text-sm font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                       text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10
                       border border-white/5 hover:border-rose-500/20 transition-all duration-200"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ─────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50
                         bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/5
                         flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center text-sm">💰</div>
          <span className="text-white font-bold">FinTrack</span>
        </div>
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed top-14 left-0 right-0 bottom-0 z-50
                          bg-[#0a0a1a] border-t border-white/5 animate-slide-up overflow-y-auto">
            <nav className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-white/5 mt-2">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                           text-rose-400 bg-rose-500/10 border border-rose-500/20
                           font-medium transition-all hover:bg-rose-500/20"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
