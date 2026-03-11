import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../lib/store';
import type { UserRole } from '../types';
import {
  LayoutDashboard,
  FolderOpen,
  BookCheck,
  Trophy,
  Users,
  ClipboardCheck,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  FileKey2,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['apprentice', 'coach', 'admin'] },
  { to: '/projects', label: 'Projects', icon: <FolderOpen className="h-5 w-5" />, roles: ['apprentice', 'coach', 'admin'] },
  { to: '/knowledge-checks', label: 'Knowledge Checks', icon: <BookCheck className="h-5 w-5" />, roles: ['apprentice', 'coach', 'admin'] },
  { to: '/portfolio', label: 'Portfolio', icon: <Trophy className="h-5 w-5" />, roles: ['apprentice', 'coach', 'admin'] },
  { to: '/coach', label: 'Review Queue', icon: <ClipboardCheck className="h-5 w-5" />, roles: ['coach', 'admin'] },
  { to: '/coach/apprentices', label: 'Apprentices', icon: <Users className="h-5 w-5" />, roles: ['coach', 'admin'] },
  { to: '/coach/transcripts', label: 'KC Transcripts', icon: <MessageSquare className="h-5 w-5" />, roles: ['coach', 'admin'] },
  { to: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" />, roles: ['admin'] },
  { to: '/admin/cohorts', label: 'Cohorts', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
  { to: '/admin/prompts', label: 'AI Prompts', icon: <MessageSquare className="h-5 w-5" />, roles: ['admin'] },
  { to: '/admin/audit-log', label: 'Audit Log', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
  { to: '/admin/kc-override', label: 'KC Override', icon: <FileKey2 className="h-5 w-5" />, roles: ['admin'] },
];

const roleBadgeClasses: Record<UserRole, string> = {
  apprentice: 'bg-brand-500/20 text-brand-400',
  coach: 'bg-success-500/20 text-success-400',
  admin: 'bg-warning-500/20 text-warning-400',
};

export function Layout({ children }: { children: ReactNode }) {
  const { signOut, profile } = useAuth();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const navigate = useNavigate();

  const role = profile?.role || 'apprentice';
  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 lg:relative lg:z-auto ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          {sidebarOpen && (
            <span className="text-lg font-bold text-brand-400">KOPA Academy</span>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:block"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/' || item.to === '/coach'}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    } ${!sidebarOpen ? 'justify-center lg:px-0' : ''}`
                  }
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        {sidebarOpen && (
          <div className="border-t border-slate-800 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-danger-400"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-200 lg:hidden">KOPA Academy</h1>
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeClasses[role]}`}>
                  {role}
                </span>
                <span className="text-sm text-slate-300">{profile.full_name}</span>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-danger-400 lg:block"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
